import { readFileSync } from 'fs';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import {
  ExtractJwt,
  Strategy as JwtStrategy,
  VerifiedCallback,
} from 'passport-jwt';
import { DateTime } from 'luxon';
import isInt from 'validator/lib/isInt';
import { UserAttribs } from '../../models/User.model';
import ServerError from '../errors/ServerError';
import Logger from '../logger';
import Service from '../Service';
import User from './User';
import UserModel from '../../models/User.model';
import Action from '../Action';

type TokenType = typeof Token['TYPE'];

type TokenOptions = {
  type: keyof TokenType;
  user?: User;
  checkStart?: boolean;
};

type TokenVerifyDTO = {
  payload: jwt.JwtPayload;
};

type TokenGetOptions = {
  renew?: boolean;
  reload?: boolean;
};

type ErrorTypes =
  | 'NOT_STARTED'
  | 'FAILED'
  | 'INVALID_TOKEN_TYPE'
  | 'USER_NOT_SET'
  | 'USER_AUTH_NOT_SET'
  | 'KEY_LOAD_FAILED';

export default class Token extends Service {
  public static TYPE = Object.freeze({
    ACCESS: Symbol('TOKEN_ACCESS'),
    REFRESH: Symbol('TOKEN_REFRESH'),
  });

  public static EXP: Record<keyof TokenType, string> = Object.freeze({
    ACCESS: '1h',
    REFRESH: '30d',
  });

  public static FIELD = Object.freeze({
    ACCESS: 'sigmateAccessTokenIat',
    REFRESH: 'sigmateRefreshTokenIat',
  });

  /** JWT signing algorithm */
  private static JWT_ALG: jwt.Algorithm = 'ES256';
  /** JWT issuer */
  private static JWT_ISS = 'sigmate.io';
  /** EC Public key for verifying tokens */
  private static PUBLIC_KEY: Buffer = undefined as unknown as Buffer;
  /** EC Private key for signing tokens */
  private static SECRET_KEY: Buffer = undefined as unknown as Buffer;
  /** Auth strategy using JWT for passport library */
  public static PASSPORT_STRATEGY_JWT: JwtStrategy;

  static validate(payload: jwt.JwtPayload) {
    const { iss, sub, iat, exp } = payload;
    if (iss !== Token.JWT_ISS) return false;
    if (!sub || !isInt(sub)) return false;
    if (!iat || !exp) return false;
    return true;
  }

  static get areKeysLoaded() {
    return Boolean(Token.PUBLIC_KEY) && Boolean(Token.SECRET_KEY);
  }

  get serviceStatus() {
    return Token.status;
  }

  type: keyof TokenType;
  name = 'TOKEN';
  user: User;
  logger: Logger;

  constructor(options: TokenOptions) {
    super();
    const { user, type, checkStart = true } = options;
    if (checkStart && !Token.started) {
      this.onError({ type: 'NOT_STARTED' });
    }
    if (Token.failed) {
      this.onError({ type: 'FAILED' });
    }
    this.logger = new Logger();
    this.user = user || new User();
    this.type = type;
  }

  /** Start the Token service */
  start() {
    Token.status = Token.STATE.STARTING;
    this.logger.log({ service: this });
    try {
      Token.SECRET_KEY = readFileSync(process.env.PATH_PRIVATE_KEY);
      Token.PUBLIC_KEY = readFileSync(process.env.PATH_PUBLIC_KEY);
    } catch (error) {
      this.onError({ type: 'KEY_LOAD_FAILED' });
    }

    const env = process.env.NODE_ENV;
    switch (env) {
      case 'test':
        Token.JWT_ISS = 'beta.sigmate.io';
        break;
      case 'production':
        Token.JWT_ISS = 'sigmate.io';
        break;
      case 'development':
      default:
        Token.JWT_ISS = 'localhost';
        break;
    }

    Token.PASSPORT_STRATEGY_JWT = new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: Token.SECRET_KEY,
        issuer: Token.JWT_ISS,
        algorithms: [Token.JWT_ALG],
      },
      async (payload: jwt.JwtPayload, done: VerifiedCallback) => {
        try {
          const token = new Token({ type: 'ACCESS' });
          const user = await token.verify({ payload });
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    );
    Token.status = Token.STATE.STARTED;
    this.logger.log({ service: this });
  }

  async verify(
    dto: TokenVerifyDTO,
    parentAction: Action | undefined = undefined
  ) {
    const { payload } = dto;
    const action = new Action({
      type: Action.TYPE.SERVICE,
      name: 'TOKEN_VERIFY',
      target: { model: UserModel },
      parent: parentAction,
    });
    return await action.run(async () => {
      if (!Token.validate(payload)) return this.user;
      const iat = payload.iat as NonNullable<typeof payload.iat>;
      const exp = payload.exp as NonNullable<typeof payload.exp>;
      const ttl = Math.floor(ms(Token.EXP[this.type]) / 1000);
      if (ttl !== exp - iat) return this.user;
      const sub = payload.sub as NonNullable<typeof payload.sub>;
      const userId = Number.parseInt(sub);
      const userModel = await this.user.find(
        {
          id: userId,
          options: 'AUTH_TOKEN',
        },
        action
      );
      if (!userModel) return this.user;
      let dbIat: number | undefined;
      switch (this.type) {
        case 'ACCESS':
          dbIat = userModel.auth?.sigmateAccessTokenIat;
          break;
        case 'REFRESH':
          dbIat = userModel.auth?.sigmateRefreshTokenIat;
          break;
      }
      if (iat !== dbIat) return this.user;
      return this.user;
    });
  }

  private async reloadAuth(parentAction: Action | undefined = undefined) {
    if (!this.user.model) this.onError({ type: 'USER_NOT_SET' });
    await this.user.reload({ options: 'AUTH' }, parentAction);
  }

  private async generate(iat: number | undefined = undefined) {
    if (!this.user.model) this.onError({ type: 'USER_NOT_SET' });
    const userId = this.user.model.id as UserAttribs['id'];
    const now = DateTime.now().setZone('utc').toMillis();
    iat = iat || Math.floor(now / 1000);
    const token = await new Promise<string>((resolve, reject) => {
      jwt.sign(
        { iat },
        Token.SECRET_KEY,
        {
          issuer: Token.JWT_ISS,
          algorithm: Token.JWT_ALG,
          subject: userId.toString(),
          expiresIn: Token.EXP[this.type],
        },
        (err, token) => {
          if (err) {
            reject(err);
          } else if (token) {
            resolve(token);
          } else {
            reject(new Error('Token generation failed'));
          }
        }
      );
    });

    return { iat, token };
  }

  public async renew(parentAction: Action | undefined = undefined) {
    const action = new Action({
      name: 'TOKEN_RENEW',
      type: Action.TYPE.SERVICE,
      target: { model: UserModel },
      transaction: true,
      parent: parentAction,
    });
    return await action.run(async (tx, action) => {
      if (!this.user.model?.auth)
        await this.user.reload({ options: 'AUTH_TOKEN' }, action);
      const auth = this.user.model?.auth;
      if (!auth) this.onError({ type: 'USER_AUTH_NOT_SET' });
      const { iat, token } = await this.generate();
      const field = Token.FIELD[this.type];
      await this.user.updateAuth({ renew: { [field]: iat } }, action);
      return token;
    });
  }

  public async getToken(
    dto: TokenGetOptions = {},
    parentAction: Action | undefined = undefined
  ) {
    await this.user.reload({ options: 'AUTH_TOKEN' }, parentAction);
    const auth = this.user.model?.auth;
    if (!auth) this.onError({ type: 'USER_AUTH_NOT_SET' });
    const { renew = false } = dto;
    const iat = auth[Token.FIELD[this.type]];
    if (renew) {
      const exp = ((iat || 0) + ms(Token.EXP[this.type])) * 1000;
      const now = DateTime.now().setZone('utc').toMillis();
      if (now > exp) {
        return await this.renew(parentAction);
      }
    }
    const { token } = await this.generate(iat);
    return token;
  }

  onError(options: sigmate.Error.HandlerOptions<ErrorTypes>): never {
    const { type, error: cause } = options;
    let message = options.message || '';
    let critical = false;
    switch (type) {
      case 'NOT_STARTED':
        message = message || 'Initialized before start';
        critical = true;
        break;
      case 'KEY_LOAD_FAILED':
        message = message || 'Failed to load keys';
        critical = true;
        break;
      case 'FAILED':
        message = message || 'Cannot initialize failed service';
        critical = true;
        break;
      case 'INVALID_TOKEN_TYPE':
        message = message || `Unexpected token type: ${message}`;
        critical = true;
        break;
      case 'USER_NOT_SET':
        message = message || 'User not set';
        break;
      case 'USER_AUTH_NOT_SET':
        message = message || 'User auth data not found';
        critical = true;
        break;
      default:
        message = message || 'UNEXPECTED';
        break;
    }
    if (critical) {
      Token.status = Token.STATE.FAILED;
    }
    throw new ServerError({
      name: 'TokenError',
      message,
      critical,
      cause,
    });
  }
}
