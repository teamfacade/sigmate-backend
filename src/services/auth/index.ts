import Service from '..';
import { readFile } from 'fs/promises';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import User, { UserAttribs } from '../../models/User.model';
import AuthError from '../../errors/auth';
import { ActionArgs, ActionMethod } from '../../utils/action';
import { FindOptions } from 'sequelize/types';

type TokenType = 'ACCESS' | 'REFRESH' | 'DEVICE';
type TokenConfig = {
  ALG: jwt.Algorithm;
  ISS: string;
  EXP: string;
  TYPE: string;
};

export type AuthenticateOptions = {
  token?: {
    access?: string;
    refresh?: string;
  };
  google?: {
    code: string;
  };
  metamask?: {
    wallet: string;
    nonce?: string;
  };
  findOptions?: FindOptions<UserAttribs>;
};

const MAX_SAFE_INTEGER_LEN = Number.MAX_SAFE_INTEGER.toString().length;

export default class AuthService extends Service {
  private static __PUBLIC_KEY?: Buffer;
  /** Used to cancel file read on server close */
  private static pubKeyAbortController?: AbortController;
  private static __SECRET_KEY?: Buffer;
  /** Used to cancel file read on server close */
  private static secKeyAbortController?: AbortController;

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
        EXP: '1y',
        TYPE: 'dvc',
      },
    });

  protected get PUBLIC_KEY() {
    if (!AuthService.__PUBLIC_KEY)
      throw new Error('AuthService: Public key not loaded');
    return AuthService.__PUBLIC_KEY;
  }

  protected get SECRET_KEY() {
    if (!AuthService.__SECRET_KEY)
      throw new Error('AuthService: Secret key not loaded');
    return AuthService.__SECRET_KEY;
  }

  private get JWT_CONFIG() {
    return AuthService.JWT_CONFIG;
  }

  constructor(name = 'Auth') {
    super(name);
  }

  @ActionMethod('AUTH/TOKEN_AUTH')
  public async authenticate(args: AuthenticateOptions & ActionArgs) {
    const { token, findOptions, req } = args;
    if (!token) throw new Error('AuthService: Token not provided');
    const { access, refresh } = token;
    let user: User | null;
    if (access) {
      user = await this.verifyToken({
        type: 'ACCESS',
        token: access,
        findOptions,
      });
    } else if (refresh) {
      user = await this.verifyToken({
        type: 'REFRESH',
        token: refresh,
        findOptions,
      });
    } else {
      user = null;
    }
    if (req) req.user = user || undefined;
    return user;
  }

  @ActionMethod('AUTH/TOKEN_RENEW')
  public async getTokens(
    args: {
      user?: User | null;
      /**
       * Tokens will be renewed (new nocnes will be generated).
       */
      renew?: boolean;
      /**
       * When set to `true`, a new nonce will always be generated.
       * When set to `false`, a new nonce will only be generated when a nonce is not already set
       */
      force?: boolean;
    } & ActionArgs
  ) {
    const { user, renew, force, transaction } = args;
    if (!user) throw new AuthError('AUTH/RJ_UNAUTHENTICATED');
    const auth = user.auth;
    if (!auth) throw new AuthError('AUTH/NF_AUTH');

    // Renew tokens if necessary
    const shouldRenewAccess =
      (auth.accessNonce && force) || (!auth.accessNonce && renew);
    const shouldRenewRefresh =
      (auth.refreshNonce && force) || (!auth.refreshNonce && renew);
    if (shouldRenewAccess) {
      auth.set('accessNonce', await this.generateNonce());
    }
    if (shouldRenewRefresh) {
      auth.set('refreshNonce', await this.generateNonce());
    }
    const saveNonceChanges = auth.save({ transaction });

    // Get nonce and generate jwt with it
    const an = auth.accessNonce;
    const rn = auth.refreshNonce;
    const [accessToken, refreshToken] = await Promise.all([
      this.generateJwt('ACCESS', user, an),
      this.generateJwt('REFRESH', user, rn),
      saveNonceChanges,
    ]);

    // Return the tokens
    return { accessToken, refreshToken };
  }

  /**
   * Generate a new Sigmate JWT
   * @param type Type of Sigamte token
   * @param user User to generate the token for
   * @param nonce Nonce to use in token
   * @returns New token
   */
  private generateJwt(type: TokenType, user: User, nonce: string | undefined) {
    const secret = this.SECRET_KEY;
    const config = this.JWT_CONFIG[type];
    const auth = user.auth;
    if (!auth) throw new AuthError('AUTH/NF_AUTH');
    return new Promise<string>((resolve, reject) => {
      if (!nonce) return resolve('');
      jwt.sign(
        {
          type: config.TYPE,
          nonce,
        },
        secret,
        {
          issuer: config.ISS,
          algorithm: config.ALG,
          subject: String(user.id),
          expiresIn: config.EXP,
        },
        (err, token) => {
          if (err || !token) reject(err || new Error('Empty token'));
          else resolve(token);
        }
      );
    });
  }

  /**
   * Generate a nonce to use in Sigmate tokens
   * @returns New nonce
   */
  private generateNonce() {
    return new Promise<string>((resolve, reject) => {
      randomBytes(16, (err, buf) => {
        if (err) reject(err);
        else resolve(buf.toString('hex'));
      });
    });
  }

  @ActionMethod('AUTH/TOKEN_VERIFY')
  private async verifyToken(
    args: {
      type: TokenType;
      token: string;
      findOptions?: FindOptions<UserAttribs>;
    } & ActionArgs
  ) {
    const { type, token, findOptions, transaction } = args;
    if (type !== 'ACCESS' && type !== 'REFRESH') {
      throw new Error('Invalid token type');
    }
    if (!token) throw new Error('Empty token');
    const payload = this.safeDecodeJwt(token);
    if (!payload) throw new Error('Unsafe payload');
    const userId = payload.sub;
    if (!userId) throw new Error('User not found');
    await this.verifyJwt(type, token);

    const user = await User.findByPk(userId, {
      ...(findOptions || User.FIND_OPTS.auth),
      transaction,
    });
    if (!user) throw new Error('User not found');
    const auth = user.auth;
    if (!auth) throw new Error('Auth not found');
    let nonce: string | undefined;
    switch (type) {
      case 'ACCESS':
        nonce = auth.accessNonce;
        break;
      case 'REFRESH':
        nonce = auth.refreshNonce;
        break;
      default:
        nonce = undefined;
        break;
    }
    if (!nonce) throw new Error('Nonce not found');
    if (nonce !== payload.nonce) throw new Error('Nonce mismatch');
    return user;
  }

  /**
   * Checks JWT except for the nonce (does not call DB)
   * @param type Type of Sigmate token
   * @param token jwt in string form
   */
  private async verifyJwt(type: TokenType, token: string) {
    const cert = this.PUBLIC_KEY;
    const config = this.JWT_CONFIG[type];
    const payload = await new Promise<string | jwt.JwtPayload | undefined>(
      (resolve, reject) => {
        jwt.verify(
          token,
          cert,
          {
            issuer: config.ISS,
            algorithms: [config.ALG],
            clockTolerance: 5,
          },
          (err, payload) => {
            if (err) reject(err);
            else resolve(payload);
          }
        );
      }
    );
    if (!payload || typeof payload === 'string') {
      throw new Error('Unexpected payload type');
    }
    if (payload.type !== config.TYPE) {
      throw new Error('Unexpected token type');
    }
  }

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

  public async start() {
    this.setStatus('STARTING');
    try {
      if (!AuthService.__PUBLIC_KEY && !AuthService.__SECRET_KEY) {
        AuthService.pubKeyAbortController = new AbortController();
        AuthService.secKeyAbortController = new AbortController();

        const pSignal = AuthService.pubKeyAbortController.signal;
        const sSignal = AuthService.secKeyAbortController.signal;

        const [pubKey, secKey] = await Promise.all([
          readFile(process.env.PATH_PUBLIC_KEY, { signal: pSignal }),
          readFile(process.env.PATH_PRIVATE_KEY, { signal: sSignal }),
        ]);

        AuthService.__PUBLIC_KEY = pubKey;
        AuthService.__SECRET_KEY = secKey;

        AuthService.pubKeyAbortController = undefined;
        AuthService.secKeyAbortController = undefined;
      }
      this.setStatus('AVAILABLE');
    } catch (error) {
      this.setStatus('UNAVAILABLE');
      throw error;
    }
  }

  public async close() {
    this.setStatus('CLOSING');
    AuthService.pubKeyAbortController?.abort();
    AuthService.secKeyAbortController?.abort();
    AuthService.__PUBLIC_KEY?.fill(0);
    AuthService.__SECRET_KEY?.fill(0);
    AuthService.__PUBLIC_KEY = undefined;
    AuthService.__SECRET_KEY = undefined;
    this.setStatus('CLOSED');
  }
}

export const auth = new AuthService();
