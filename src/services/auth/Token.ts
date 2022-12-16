import { readFile } from 'fs';
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
import Logger from '../logger';
import Service from '../Service';
import User from './User';
import UserModel from '../../models/User.model';
import Action from '../Action';
import TokenError from '../errors/TokenError';

type TokenType = typeof Token['TYPES'];

type TokenOptions = {
  type: keyof TokenType;
  /** User service instance */
  user?: User;
  checkStart?: boolean;
};

type TokenVerifyDTO = {
  /**
   * When verifying the given token, use this value as the expected token type,
   * overriding the value set in this Token instance
   */
  expect?: keyof TokenType;
  /**
   * A string containing a Sigmate token (JWT) to verify
   */
  token?: string;
  payload?: jwt.JwtPayload;
};

type TokenGetOptions = {
  renew?: boolean;
  reload?: boolean;
};

export default class Token extends Service {
  /** Different types of Sigmate JWTs */
  public static TYPES = Object.freeze({
    ACCESS: Symbol('TOKEN_ACCESS'),
    REFRESH: Symbol('TOKEN_REFRESH'),
  });

  /** Expiration periods */
  public static EXP: Record<keyof TokenType, string> = Object.freeze({
    ACCESS: '1h',
    REFRESH: '30d',
  });

  /**
   * Name of the columns in the DB that stores the iat value of the
   * last issued token, for each token type
   */
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

  /**
   * Check if the JWT payload is valid and contains all necessary attributes
   * @param payload JWT payload
   * @returns Whether payload is valid
   */
  static validate(payload: jwt.JwtPayload) {
    const { iss, sub, iat, exp } = payload;
    if (iss !== Token.JWT_ISS) return false;
    if (!sub || !isInt(sub)) return false;
    if (!iat || !exp) return false;
    return true;
  }

  /**
   * Retrun true if public and secret keys are properly loaded
   */
  static get areKeysLoaded() {
    return Boolean(Token.PUBLIC_KEY) && Boolean(Token.SECRET_KEY);
  }

  get serviceStatus() {
    return Token.status;
  }

  type: keyof TokenType;
  name = 'TOKEN';
  user: User;
  /** Shorthand property for the static attribute `logger` */
  logger?: Logger;

  constructor(options: TokenOptions) {
    super();
    const { user, type, checkStart = true } = options;
    if (checkStart && !Token.started) {
      throw new TokenError({ code: 'SERVICE/INIT_BEFORE_START' });
    }
    if (Token.failed) {
      throw new TokenError({ code: 'SERVICE/INIT_AFTER_FAIL' });
    }
    this.logger = Token.logger;
    this.user = user || new User();
    this.type = type;
  }

  /**
   * Start the Token service.
   * Load the keys, initialize `passport` Strategy
   */
  async start() {
    Token.status = Token.STATE.STARTING;
    this.logger?.log({ service: this });

    // Load public key asynchronously
    const pKeyPrm = new Promise<Buffer>((resolve, reject) => {
      readFile(process.env.PATH_PUBLIC_KEY, (err, data) => {
        err ? reject(err) : resolve(data);
      });
    });

    // Load secret key asynchronously
    const sKeyPrm = new Promise<Buffer>((resolve, reject) => {
      readFile(process.env.PATH_PRIVATE_KEY, (err, data) => {
        err ? reject(err) : resolve(data);
      });
    });

    try {
      // Load keys simultaneously
      const [pKey, sKey] = await Promise.all([pKeyPrm, sKeyPrm]);
      Token.PUBLIC_KEY = pKey;
      Token.SECRET_KEY = sKey;
    } catch (error) {
      const sysErrCode = (error as any)?.code;
      // ENOENT: File does not exist
      throw new TokenError({
        code:
          sysErrCode === 'ENOENT' ? 'TOKEN/NA_KEY_FILE' : 'TOKEN/ER_KEY_READ',
        error,
      });
    }

    // Set Token issuer depending on the environment
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

    // Initialize passport strategy for JWT
    Token.PASSPORT_STRATEGY_JWT = new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: Token.SECRET_KEY,
        issuer: Token.JWT_ISS,
        algorithms: [Token.JWT_ALG],
      },
      async (payload: jwt.JwtPayload, done: VerifiedCallback) => {
        // Expiration dates and signature have already been checked
        try {
          // Only access tokens are valid for authentication
          const token = new Token({ type: 'ACCESS' });
          // Validate and verify paylaod, and find user
          const user = await token.verify({ payload });
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    );

    Token.status = Token.STATE.STARTED;
    this.logger?.log({ service: this });
  }

  /**
   * Check token payload and find the user specified in the token payload
   * @param dto Token payload
   * @returns Return the User service instance
   */
  async verify(
    dto: TokenVerifyDTO,
    parentAction: Action | undefined = undefined
  ) {
    const action = new Action({
      type: Action.TYPE.SERVICE,
      name: 'TOKEN_VERIFY',
      target: { model: UserModel },
      parent: parentAction,
    });
    return await action.run(async () => {
      const { expect, token } = dto;
      let { payload = {} } = dto;

      if (token) {
        try {
          const vPayload = jwt.verify(token, Token.PUBLIC_KEY, {
            issuer: Token.JWT_ISS,
            algorithms: [Token.JWT_ALG],
          });
          if (typeof vPayload === 'object') {
            payload = vPayload;
          } else {
            throw new TokenError({ code: 'TOKEN/IV_VERIFY_PAYLOAD' });
          }
        } catch (error) {
          if (error instanceof TokenError) throw error;
          throw new TokenError({ code: 'TOKEN/IV_VERIFY_PAYLOAD', error });
        }
      }

      if (!payload) {
        throw new TokenError({ code: 'TOKEN/IV_VERIFY_PAYLOAD' });
      }

      // Validate payload
      if (!Token.validate(payload)) {
        throw new TokenError({ code: 'TOKEN/IV_VERIFY_PAYLOAD' });
      }

      // Check token type by checking the expiration time
      const iat = payload.iat as NonNullable<typeof payload.iat>;
      const exp = payload.exp as NonNullable<typeof payload.exp>;
      const type = expect || this.type;
      const ttl = Math.floor(ms(Token.EXP[type]) / 1000);
      if (ttl !== exp - iat) {
        throw new TokenError({ code: 'TOKEN/ER_VERIFY_TYPE' });
      }

      // Look for user in the database
      const sub = payload.sub as NonNullable<typeof payload.sub>;
      const userId = Number.parseInt(sub);
      const userModel = await this.user.find(
        {
          id: userId,
          options: 'AUTH_TOKEN',
        },
        action
      );
      // User not found
      if (!userModel) throw new TokenError({ code: 'USER/NF' });

      // Check if the Token is still valid
      let dbIat: number | undefined;
      switch (this.type) {
        case 'ACCESS':
          dbIat = userModel.auth?.sigmateAccessTokenIat;
          break;
        case 'REFRESH':
          dbIat = userModel.auth?.sigmateRefreshTokenIat;
          break;
      }
      if (iat !== dbIat) {
        this.user.unset();
        throw new TokenError({ code: 'TOKEN/ER_VERIFY_IAT' });
      }
      return this.user;
    });
  }

  /**
   * Generate a new token for a user with the given iat value
   * @param iat JWT iat value, UNIX timestamp in seconds
   * @returns Object containing iat value and generated token
   */
  private async generate(iat: number | undefined = undefined) {
    if (!this.user.model)
      throw new TokenError({
        code: 'TOKEN/NA_USER',
        message: 'Token generate failed',
      });
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

  /**
   * Generate a new token for a user and update the DB
   * @returns Generated token
   */
  public async renew(parentAction: Action | undefined = undefined) {
    const action = new Action({
      name: 'TOKEN_RENEW',
      type: Action.TYPE.SERVICE,
      target: { model: UserModel },
      transaction: true,
      parent: parentAction,
    });
    return await action.run(async ({ action }) => {
      if (!this.user.model?.auth)
        await this.user.reload({ options: 'AUTH_TOKEN' }, action);
      const auth = this.user.model?.auth;
      if (!auth)
        throw new TokenError({
          code: 'TOKEN/NF_USER_AUTH',
          message: 'Token renew failed',
        });
      const { iat, token } = await this.generate();
      const field = Token.FIELD[this.type];
      await this.user.updateAuth({ renew: { [field]: iat } }, action);
      return token;
    });
  }

  public changeType(type: keyof TokenType) {
    this.type = type;
  }

  /**
   * Obtain token for the user by obtaining last valid iat from database and
   * generating the token using that value.
   * When using probablistic signing algorithms such as ES256, obtained tokens
   * will contain the same payload, but the signature may be different with
   * every generation.
   *
   * @param dto.renew Expired tokens will automatically when set to `true`
   * @param dto.reload User model will reload
   * @param parentAction
   * @returns Sigmate token
   */
  public async getToken(
    dto: TokenGetOptions = {},
    parentAction: Action | undefined = undefined
  ) {
    const action = new Action({
      name: 'TOKEN_GET',
      type: Action.TYPE.SERVICE,
      transaction: true,
      parent: parentAction,
    });

    return await action.run(async () => {
      // Check auth data exists
      const auth = this.user.model?.auth;
      if (!auth)
        throw new TokenError({
          code: 'TOKEN/NF_USER_AUTH',
          message: 'Token get failed',
        });

      const { renew = false, reload } = dto;
      if (reload === false) {
        await this.user.reload({ options: 'AUTH_TOKEN' }, parentAction);
      }

      // Get iat from DB
      const iat = auth[Token.FIELD[this.type]];
      if (renew) {
        const exp = ((iat || 0) + ms(Token.EXP[this.type])) * 1000;
        const now = DateTime.now().setZone('utc').toMillis();
        // If token is expired, renew it
        if (now > exp) {
          return await this.renew(action);
        }
      }
      // If renew did not occur, generate the token using current iat
      const { token } = await this.generate(iat);
      return token;
    });
  }
}
