import { createHash, randomBytes, randomInt } from 'crypto';
import { readFile } from 'fs/promises';
import jwt from 'jsonwebtoken';
import { DateTime } from 'luxon';
import Auth from '../../models/user/Auth.model';
import User from '../../models/user/User.model';
import Action, { ActionWorkerOptions } from '../../utils/Action';
import TokenError from '../errors/TokenError';
import AuthService from './AuthService';

type TokenType = 'ACCESS' | 'REFRESH' | 'DEVICE';
type TokenConfig = {
  ALG: jwt.Algorithm;
  ISS: string;
  EXP: string;
  TYPE: string;
};

type TokenObj<T = string> = {
  access?: T;
  refresh?: T;
  device?: T;
};

type GetTokenDTO = {
  user: User;
  uaText?: string;
  renew?: boolean;
} & TokenObj<boolean>;

const MAX_SAFE_INTEGER_LEN = Number.MAX_SAFE_INTEGER.toString().length;

type GetNonceArgs = {
  user?: User;
  userId?: string;
  renew?: boolean;
} & Omit<TokenObj<boolean>, 'device'>;

export default class TokenAuthService extends AuthService {
  public static instance: TokenAuthService;

  private static PUBLIC_KEY?: Buffer;
  private static SECRET_KEY?: Buffer;
  private static DEVICE_SECRET: string;

  private static JWT_CONFIG: Readonly<Record<TokenType, TokenConfig>> =
    Object.freeze({
      ACCESS: {
        ALG: 'ES256',
        ISS: 'sigmate.io',
        EXP: '1h',
        TYPE: 'acc',
      },
      REFRESH: {
        ALG: 'ES256',
        ISS: 'sigmate.io',
        EXP: '30d',
        TYPE: 'ref',
      },
      DEVICE: {
        ALG: 'ES256',
        ISS: 'sigmate.io',
        EXP: '2y',
        TYPE: 'dvc',
      },
    });

  private static NONCE_SIZE_BYTES = 32;

  constructor() {
    super({ name: 'TokenAuth' });
  }

  public getToken = Action.create(
    async (
      { user, access, refresh, device, uaText, renew }: GetTokenDTO,
      { transaction, action: parent }: ActionWorkerOptions
    ) => {
      const userId = user?.id;
      if (!userId) throw new TokenError({ code: 'TOKEN/RJ_UID' });
      const auth = user.auth || (await user.$get('auth', { transaction }));
      if (!auth) throw new TokenError({ code: 'TOKEN/NF_AUTH' });
      const tokens: TokenObj = {};
      const nonces: TokenObj = await this.getNonce(
        { user, renew, access, refresh },
        { parent }
      );
      const iat = DateTime.utc();
      const ps: Promise<string>[] = [];
      if (access) {
        const p = this.createJwt({
          user,
          type: 'ACCESS',
          iat,
          nonce: nonces.access,
        }).then((t) => (tokens.access = t));
        ps.push(p);
      }
      if (refresh) {
        const p = this.createJwt({
          user,
          type: 'REFRESH',
          iat,
          nonce: nonces.refresh,
        });
        ps.push(p);
      }
      if (device) {
        const p = this.createJwt({ user, type: 'DEVICE', iat, uaText }).then(
          (t) => (tokens.device = t)
        );
        ps.push(p);
      }
      if (ps.length > 0) await Promise.all(ps);
      return tokens;
    },
    { name: 'AUTH_TOKEN_GET', transaction: true }
  );

  /**
   * Update the Auth table with the given nonce values
   * @param auth Auth model instance
   * @param nonce Object containing nonce values
   */
  private renewNonce = Action.create(
    async (
      { auth, nonce }: { auth: Auth; nonce: TokenObj },
      { transaction }: ActionWorkerOptions
    ) => {
      if (nonce.access) {
        auth.set('accessTokenNonce', nonce.access);
      }
      if (nonce.refresh) {
        auth.set('refreshTokenNonce', nonce.refresh);
      }
      await auth.save({ transaction });
    },
    { name: 'AUTH_TOKEN_RENEW', transaction: true, type: 'DATABASE' }
  );

  /**
   * Check whether given device token is valid
   * @param token Token string
   * @param uaText HTTP User-Agent header
   * @param userId User ID
   * @returns JWT payload if valid
   * @throws TokenError if token is invalid
   */
  public verifyDeviceToken = async ({
    token,
    uaText,
    userId,
  }: {
    token: string;
    uaText: string;
    userId: string;
  }) => {
    try {
      if (!token) throw new Error('Empty token');
      if (!uaText) throw new Error('Empty User-Agent');
      if (!userId) throw new Error('Empty User ID');
      return await this.verfiyJwt({ token, type: 'DEVICE', userId, uaText });
    } catch (error) {
      throw new TokenError({
        code: 'TOKEN/RJ_VERIFY',
        message: error instanceof Error ? error.message : undefined,
      });
    }
  };

  /**
   * (Action) Verify a given Sigmate token is valid
   * @param token Token string
   * @param type Expected token type
   */
  public verfiyToken = Action.create(
    async (
      { token, type }: { token: string; type: TokenType },
      { action }: ActionWorkerOptions
    ) => {
      try {
        if (!token) throw new Error('Empty token');
        const payload = this.safeDecodeJwt(token);
        if (!payload) throw new Error('Unsafe payload');
        const userId = payload.sub;
        if (!userId) throw new Error('User id not found');
        const nonces = await this.getNonce(
          { userId, access: type === 'ACCESS', refresh: type === 'REFRESH' },
          { parent: action }
        );
        let nonce = '';
        if (type === 'ACCESS') {
          nonce = nonces.access as NonNullable<typeof nonces.access>;
        }
        if (type === 'REFRESH') {
          nonce = nonces.refresh as NonNullable<typeof nonces.refresh>;
        }
        if (!nonce) throw new Error('Nonce fetch failed');
        return await this.verfiyJwt({ token, type, userId, nonce });
      } catch (error) {
        throw new TokenError({
          code: 'TOKEN/RJ_VERIFY',
          message: error instanceof Error ? error.message : undefined,
        });
      }
    },
    { name: 'AUTH_TOKEN_VERIFY', transaction: true }
  );

  /**
   * (Action) Fetches the user's token nonce from the database
   * @param userId User id in string
   * @param type Token type (either `ACCESS` or `REFRESH`)
   * @returns Fetched nonce (can be undefined)
   */
  private getNonce = Action.create(
    async (
      args: GetNonceArgs,
      { transaction, action: parent }: ActionWorkerOptions
    ) => {
      const { user, userId, renew, access, refresh } = args;
      if (!user && !userId) throw new TokenError({ code: 'TOKEN/RJ_UID' });
      let auth: Auth | null = null;
      if (userId) {
        auth = await Auth.scope('token').findOne({
          where: { userId },
          transaction,
        });
      } else if (user) {
        auth = user.auth || (await user.$get('auth'));
      }
      if (!auth) throw new TokenError({ code: 'TOKEN/NF_AUTH' });

      const nonce: Omit<TokenObj, 'device'> = {};
      const ps: Promise<unknown>[] = [];
      let renewed = false;
      if (access) {
        if (renew || !auth.accessTokenNonce) {
          renewed = true;
          const p = this.generateNonce().then((n) => (nonce.access = n));
          ps.push(p);
        } else {
          nonce.access = auth.accessTokenNonce;
        }
      }
      if (refresh) {
        if (renew || !auth.refreshTokenNonce) {
          renewed = true;
          const p = this.generateNonce().then((n) => (nonce.refresh = n));
          ps.push(p);
        } else {
          nonce.refresh = auth.refreshTokenNonce;
        }
      }
      if (renewed) {
        const p = this.renewNonce({ auth, nonce }, { parent });
        ps.push(p);
      }
      await Promise.all(ps);
      return nonce;
    },
    { name: 'AUTH_TOKEN_GET_NONCE', type: 'DATABASE', transaction: true }
  );

  /**
   * Check if numerical values in the token payload are within "safe" boundaries
   * @param token JWT token string
   * @returns Safe payload
   */
  private safeDecodeJwt(token: string) {
    const payload = jwt.decode(token);
    if (!payload || typeof payload === 'string') return null;

    const { sub, iat, exp } = payload;
    if (!sub || !iat) return null;

    if (sub.length > MAX_SAFE_INTEGER_LEN) return null;
    if (!Number.isSafeInteger(Number.parseInt(sub))) return null;
    if (!Number.isSafeInteger(iat)) return null;
    if (exp && !Number.isSafeInteger(exp)) return null;

    return payload;
  }

  /**
   * Asynchronously verify JWT using the jsonwebtoken library, and returns the jwt payload.
   * User nonce should be fetched from the database by the caller.
   * @param token Token string from user request
   * @param type Expected token type
   * @param user User model
   * @param nonce Expected nonce (leave empty for device tokens)
   * @param uaText User-Agent HTTP header (requried only for device tokens)
   * @returns JWT payload
   * @throws TokenError if JWT is invalid or expired
   */
  private async verfiyJwt(dto: {
    token: string;
    type: TokenType;
    userId: string;
    nonce?: string;
    uaText?: string;
  }) {
    const { token, type, userId, nonce, uaText } = dto;
    const cert = TokenAuthService.PUBLIC_KEY;
    if (!cert) throw new TokenError({ code: 'TOKEN/NF_PUBLIC_KEY' });
    if (!(type in TokenAuthService.JWT_CONFIG)) {
      throw new TokenError({ code: 'TOKEN/IV_TYPE', message: String(type) });
    }
    if (!userId) {
      throw new TokenError({ code: 'TOKEN/RJ_UID', message: String(userId) });
    }
    const config = TokenAuthService.JWT_CONFIG[type];

    try {
      if (!token) throw new Error('Empty token');
      const payload = await new Promise<string | jwt.JwtPayload | undefined>(
        (resolve, reject) => {
          jwt.verify(
            token,
            cert,
            {
              issuer: config.ISS,
              algorithms: [config.ALG],
              subject: userId,
              clockTolerance: 5, // seconds
              nonce: nonce || undefined,
            },
            (err, payload) => {
              if (err) reject(err);
              else resolve(payload);
            }
          );
        }
      );

      if (!payload || typeof payload === 'string') {
        throw new Error(`Invalid payload type: ${typeof payload}`);
      }
      if (!payload.type || payload.type !== config.TYPE) {
        throw new Error(
          `Wrong token type. Expected '${config.TYPE}', but got '${payload.type}'`
        );
      }
      if (type === 'DEVICE') {
        if (uaText === undefined) {
          throw new Error(
            'User agent not provided for device token verification'
          );
        }
        // Issued time in seconds
        const iat = payload.iat as NonNullable<jwt.JwtPayload['iat']>;
        const hash = await this.generateDeviceHash({
          uaText,
          userId,
          iat: DateTime.fromMillis(iat * 1000),
        });
        if (payload.hash !== hash) {
          throw new Error('Device hash does not match');
        }
      }
      return payload;
    } catch (error) {
      throw new TokenError({ code: 'TOKEN/RJ_VERIFY', error });
    }
  }

  /**
   * Asynchronously sign a jwt with the given data
   * @param user User model
   * @param type Token type
   * @param iat DateTime to use for token iat payload
   * @param uaText HTTP User-Agent header
   * @param nonce Nonce to use instead of generating one
   * @returns
   */
  private async createJwt(args: {
    user: User;
    type: TokenType;
    iat?: DateTime;
    uaText?: string;
    nonce?: string;
  }) {
    const { user, type, iat = DateTime.utc(), uaText, nonce } = args;
    const userId = String(user.id);
    if (!userId) {
      throw new TokenError({ code: 'TOKEN/RJ_UID' });
    }
    if (!(type in TokenAuthService.JWT_CONFIG)) {
      throw new TokenError({ code: 'TOKEN/IV_TYPE', message: String(type) });
    }
    const config = TokenAuthService.JWT_CONFIG[type];

    const payload: jwt.JwtPayload = {
      iat: Math.floor(iat.toMillis() / 1000),
      type: config.TYPE,
    };

    const options: jwt.SignOptions = {
      issuer: config.ISS,
      algorithm: config.ALG,
      subject: userId,
      expiresIn: config.EXP,
    };

    if (type === 'DEVICE') {
      // Device hash
      if (!uaText) {
        throw new TokenError({
          code: 'TOKEN/IV_DVC_TOK_DTO',
          message: `uaText: ${String(uaText)}`,
        });
      }
      payload.device = await this.generateDeviceHash({ uaText, iat, userId });
    } else {
      // Token nonce
      payload.nonce = nonce || (await this.generateNonce());
    }

    const secret = TokenAuthService.SECRET_KEY;
    if (!secret) throw new Error('Secret key not loaded');
    return await new Promise<string>((resolve, reject) => {
      jwt.sign(payload, secret, options, (err, token) => {
        if (err || !token) reject(err || new Error('Token empty'));
        else resolve(token);
      });
    });
  }

  private generateNonce() {
    return new Promise<string>((resolve, reject) => {
      randomBytes(TokenAuthService.NONCE_SIZE_BYTES, (err, buf) => {
        if (err || !buf) reject(err || new Error('Nonce empty'));
        return buf.toString('hex');
      });
    });
  }

  private generateDeviceHash(args: {
    uaText: string;
    userId: string | number;
    iat: DateTime;
  }) {
    const { uaText, iat } = args;
    let userId = args.userId;
    return new Promise<string>((resolve) => {
      if (typeof userId === 'number') {
        userId = userId.toString();
      }

      const hash = createHash('sha256');
      hash.update(uaText);
      hash.update(userId);
      hash.update(iat.toMillis().toString());
      hash.update(TokenAuthService.DEVICE_SECRET);

      resolve(hash.digest('hex'));
    });
  }

  private generateDeviceSecret() {
    if (process.env.DEVICE_SECRET) return process.env.DEVICE_SECRET;

    const chars = Array.from('abcdefghijklmnopqrstuvwxyz0123456789');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      const temp = chars[i];
      chars[i] = chars[j];
      chars[j] = temp;
    }

    return chars.join('');
  }

  public async start() {
    this.setStatus('STARTING');

    // Read key from file
    if (process.env.PATH_PUBLIC_KEY && process.env.PATH_PRIVATE_KEY) {
      try {
        const keys = await Promise.all([
          readFile(process.env.PATH_PUBLIC_KEY),
          readFile(process.env.PATH_PRIVATE_KEY),
        ]);

        TokenAuthService.PUBLIC_KEY = keys[0];
        TokenAuthService.SECRET_KEY = keys[1];
      } catch (error) {
        this.setStatus('FAILED', error);
        throw error;
      }
    } else {
      // TODO AWS Secrets Manager
      const error = new Error('Auth: paths not set in env');
      this.setStatus('FAILED', error);
      throw error;
    }

    TokenAuthService.DEVICE_SECRET = this.generateDeviceSecret();

    this.setStatus('AVAILABLE');
  }

  public async close() {
    this.setStatus('CLOSING');
    TokenAuthService.PUBLIC_KEY = undefined;
    TokenAuthService.SECRET_KEY = undefined;
    this.setStatus('CLOSED');
  }
}

export const tokenAuth = new TokenAuthService();
