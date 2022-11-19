import jwt from 'jsonwebtoken';
import {
  ExtractJwt,
  Strategy as JwtStrategy,
  VerifiedCallback,
} from 'passport-jwt';
import { readFileSync } from 'fs';
import isInt from 'validator/lib/isInt';
import BaseService from '../base/BaseService';
import User, { UserAttribs, UserCAttribs } from '../../../models/User.model';
import Device from '../../../models/Device.model';
import AuthError from '../errors/AuthError';
import services from '../..';
import UserAuth, { UserAuthAttribs } from '../../../models/UserAuth.model';
import UserGroup from '../../../models/UserGroup.model';
import { FindOptions, Transaction } from 'sequelize/types';
import ms from 'ms';
import UserService from '../UserService';
import DeviceService from '../DeviceService';

export type AuthServiceOptions = {
  user?: UserService;
  device?: DeviceService;
  system?: boolean;
};
export type SigmateJwtPayload = sigmate.Auth.JwtPayload & jwt.JwtPayload;
type TokenType =
  | typeof AuthService['JWT_TOK_ACC']
  | typeof AuthService['JWT_TOK_REF'];

type SignupDTO = Pick<
  UserCAttribs,
  | 'email'
  | 'displayName'
  | 'profileImageUrl'
  | 'metamaskWallet'
  | 'googleAccount'
  | 'googleAccountId'
  | 'locale'
> &
  Pick<
    UserAuthAttribs,
    'googleAccessToken' | 'googleRefreshToken' | 'metamaskNonce'
  >;

export default class AuthService extends BaseService {
  // Sigmate Tokens
  /** JWT signing algorithm */
  private static JWT_ALG: jwt.Algorithm = 'ES256';
  /** JWT issuer */
  private static JWT_ISS = 'sigmate.io';
  /** JWT expiration time for Sigmate access token */
  private static JWT_EXP_ACC = '1h';
  /** JWT expiration time for Sigmate refresh token */
  private static JWT_EXP_REF = '30d';
  /** Token type for Sigmate access token */
  public static JWT_TOK_ACC: 'a' = 'a';
  /** Token type for Sigmate refresh token */
  public static JWT_TOK_REF: 'r' = 'r';
  /** EC Public key for verifying tokens */
  private static PUB_KEY: Buffer = undefined as unknown as Buffer;
  /** EC Private key for signing tokens */
  private static SECRET_KEY: Buffer = undefined as unknown as Buffer;

  public static USER_SELECT_OPTIONS: FindOptions<UserAttribs> = {
    attributes: ['id', 'isAdmin', 'lastLoginAt', 'isMetamaskVerified'],
    include: [UserAuth, UserGroup],
  };

  /** Strategy for the `passport` library to use JWT */
  public static PASSPORT_STRATEGY_JWT: JwtStrategy;

  /**
   * A "fake" User model instance that does not exist in the database
   * Used for logging actions invoked by SYSTEM
   */
  static SYSTEM_USER: UserService = undefined as unknown as UserService;
  /**
   * A "fake" UserDevice model instance that does not exist in the database
   * Used for logging actions invoked by SYSTEM
   */
  static SYSTEM_DEVICE: DeviceService = undefined as unknown as DeviceService;

  static started = false;

  /**
   * Check if both public and private keys have been loaded
   */
  protected static get isKeysLoaded(): boolean {
    return Boolean(AuthService.PUB_KEY) && Boolean(AuthService.SECRET_KEY);
  }

  /**
   * Loads the public and private key from file
   */
  public static loadKeys() {
    if (this.isKeysLoaded) return;
    this.SECRET_KEY = readFileSync(process.env.PATH_PRIVATE_KEY);
    this.PUB_KEY = readFileSync(process.env.PATH_PUBLIC_KEY);
  }

  static start() {
    // Sigmate tokens
    this.SYSTEM_USER = new UserService(User.build({ id: 0 }));
    this.SYSTEM_DEVICE = new DeviceService(Device.build({ id: 0 }));
    this.loadKeys();
    this.PASSPORT_STRATEGY_JWT = new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: this.SECRET_KEY,
        issuer: this.JWT_ISS,
        algorithms: [this.JWT_ALG],
      },
      async (payload: SigmateJwtPayload, done: VerifiedCallback) => {
        try {
          const { tok, sub, group, isAdmin } = payload;
          const isAccessToken = tok === this.JWT_TOK_ACC;
          const isSubjectSet = sub && isInt(sub);
          const isGroupSet = Boolean(group);
          const isAdminSet = isAdmin !== undefined;
          if (!isAccessToken || !isSubjectSet || !isGroupSet || !isAdminSet)
            return done(null, null);
          const userId = Number.parseInt(sub);
          if (!userId || isNaN(userId)) return done(null, null);

          // Trust the token (No call to DB)
          const user = User.build({
            id: userId,
            groupId: group,
            isAdmin,
          });
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    );
    this.started = true;
  }

  user: UserService;
  device: DeviceService;

  get isAuthenticated() {
    return Boolean(this.user.user);
  }

  constructor({ user, device, system }: AuthServiceOptions) {
    super();
    if (!AuthService.started) throw new AuthError('SERVICE/INIT');
    this.user = system ? AuthService.SYSTEM_USER : user || new UserService();
    this.device = system
      ? AuthService.SYSTEM_DEVICE
      : device || new DeviceService();
  }

  /**
   * Generate a new signed Sigmate access or refresh token
   * @param type Type of token
   * @param iat Use provided iat as the token issue timestamp (unit: seconds)
   * @returns Generated Sigmate token
   */
  private async generateToken(
    type: TokenType,
    iat: number | undefined = undefined
  ) {
    if (!this.user.user?.group) throw new AuthError('USER/UNAUTHENTICATED');
    const user = this.user.user;
    const group = this.user.user.group;
    const payload: sigmate.Auth.JwtPayload = {
      type, // Token type
      group: group.id, // User group id
      isAdmin: user.isAdmin || false, // User.isAdmin
    };

    // To save storage, only the issued time (iat) is stored in the DB
    // When a request is made to "get" an old token from the DB without renewing them,
    // we are actually re-creating them using the iat values from the DB.
    // When the iat property exists in the payload, it will be used instead of the
    // current timestamp.
    if (iat) payload.iat = iat;

    const options: jwt.SignOptions = {
      issuer: AuthService.JWT_ISS,
      algorithm: AuthService.JWT_ALG,
      subject: user.id.toString(),
      expiresIn:
        type === 'r' ? AuthService.JWT_EXP_REF : AuthService.JWT_EXP_ACC,
    };

    return jwt.sign(payload, AuthService.SECRET_KEY, options);
  }

  /**
   * **[DB]** Generate a new Sigmate access or refresh token and invalidate old tokens (if any)
   * @param type Token Type
   * @param transaction Transaction to use for token refresh
   * @return Return the renewed token(s). If the token has not been renewed, an empty string (`''`) is returned
   */
  private async renewToken(
    type: TokenType | 'both',
    transaction: Transaction | undefined = undefined
  ) {
    // Generate a new token
    if (!this.user.user?.auth) throw new AuthError('USER/UNAUTHENTICATED');
    const auth = this.user.user.auth;
    let accessToken = '';
    let refreshToken = '';

    // Access token
    if (type === 'a' || type === 'both') {
      accessToken = await this.generateToken('a');
      const { iat } = jwt.decode(accessToken) as SigmateJwtPayload;
      auth.set('sigmateAccessTokenIat', iat);
    }
    // Refresh token
    if (type === 'both' || type === 'r') {
      refreshToken = await this.generateToken('r');
      const { iat } = jwt.decode(refreshToken) as SigmateJwtPayload;
      auth.set('sigmateRefreshTokenIat', iat);
    }

    // Update the DB
    await services.db.run(() => auth.save({ transaction }));

    return { accessToken, refreshToken };
  }

  /**
   * Verify a given token by checking the following
   * - Token is valid and not expired
   * - Payload is valid (contains userId, isAdmin, group)
   *
   * **CAUTION:** This method does **NOT** compare token payload with DB.
   * Perform the check elsewhere before trusting the token.
   * @param type Type of token ('a' for access, 'r' for refresh)
   * @param token Sigmate token
   * @returns Promise that resolve to the payload if verified, rejects otherwise
   * @throws AuthError if the token is invalid, expired, or not provided
   */
  private async verifyToken(type: TokenType, token: string) {
    // Token not supplied
    if (!token) throw new AuthError('USER/UNAUTHENTICATED');

    // Check validity, expiration time, and signature
    return await new Promise<SigmateJwtPayload>((resolve, reject) => {
      try {
        // Verify and decode payload
        const payload = jwt.verify(token, AuthService.PUB_KEY, {
          issuer: AuthService.JWT_ISS,
          algorithms: [AuthService.JWT_ALG],
        });

        // Check payload
        if (payload && typeof payload === 'object') {
          const { group, isAdmin } = payload;
          if (
            payload.type === type &&
            payload.sub !== undefined &&
            isInt(payload.sub, { min: 1 }) &&
            group !== undefined &&
            isAdmin !== undefined
          ) {
            // Verified!
            resolve(payload as SigmateJwtPayload);
          } else {
            // Wrong token type
            reject(new AuthError('USER/UNAUTHENTICATED'));
          }
        } else {
          // Invalid payload
          reject(new AuthError('USER/UNAUTHENTICATED'));
        }
      } catch (err) {
        // Invalid jwt or expired token
        reject(new AuthError('USER/UNAUTHENTICATED'));
      }
    });
  }

  /**
   * **[DB]** Return the current user's Sigmate tokens.
   * @param renew If the latest issued token is expired, renew the token
   * @returns Sigmate access and refresh tokens
   */
  public async getSigmateTokens(renew = true) {
    const auth = this.user.user?.auth;
    if (!auth) throw new AuthError('USER/UNAUTHENTICATED');
    let shouldRenewAccess = false;
    let shouldRenewRefresh = false;
    let accessToken = '';
    let refreshToken = '';

    if (renew) {
      // Check if any of the tokens need renewing
      const now = Math.floor(new Date().getTime() / 1000) * 1000;
      if (auth.sigmateAccessTokenIat) {
        const exp =
          auth.sigmateAccessTokenIat * 1000 + ms(AuthService.JWT_EXP_ACC);
        if (now > exp) shouldRenewAccess = true; // expired
      } else {
        shouldRenewAccess = true;
      }
      if (auth.sigmateRefreshTokenIat) {
        const exp =
          auth.sigmateRefreshTokenIat * 1000 + ms(AuthService.JWT_EXP_REF);
        if (now > exp) shouldRenewRefresh = true; // expired
      } else {
        shouldRenewRefresh = true;
      }
      const shouldRenewBoth = shouldRenewAccess && shouldRenewRefresh;
      if (shouldRenewAccess || shouldRenewRefresh) {
        // Perform the renewal
        const type = shouldRenewBoth ? 'both' : shouldRenewAccess ? 'a' : 'r';
        const tokens = await this.renewToken(type);

        // Obtain the renewed tokens
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
      }
    }

    // If no renewal took place, token values will still be an empty string
    // Obtain the old tokens
    if (!accessToken && auth.sigmateAccessTokenIat) {
      accessToken = await this.generateToken('a', auth.sigmateAccessTokenIat);
    }
    if (!refreshToken && auth.sigmateRefreshTokenIat) {
      refreshToken = await this.generateToken('r', auth.sigmateRefreshTokenIat);
    }

    return { accessToken, refreshToken };
  }

  /**
   * Handle new account creation
   * @param dto User information to populate for the new user
   */
  protected async signup(dto: SignupDTO) {
    for (const key in dto) {
      if (dto[key as keyof SignupDTO] === undefined) {
        delete dto[key as keyof SignupDTO];
      }
    }
    await this.user.create(dto);
    await this.renewToken('both');
  }

  public async authenticate(
    method: sigmate.Auth.AuthMethod,
    dto: sigmate.Auth.AuthDTO
  ) {
    // Check args: Parse token type
    if (method !== 'jwt' || !dto.jwt) throw new AuthError('JWT/METHOD');
    const { accessToken, refreshToken } = dto.jwt;
    let type: TokenType | undefined = undefined;
    let token = '';
    if (accessToken) {
      type = 'a';
      token = accessToken;
    } else if (refreshToken) {
      type = 'r';
      token = refreshToken;
    }
    if (!type) {
      throw new AuthError('JWT/METHOD');
    }

    // Verify the token
    const payload = await this.verifyToken(type, token);
    if (!payload) throw new AuthError('USER/UNAUTHENTICATED');

    // Check if user exists
    const userId = Number.parseInt(payload.sub as string);
    const user = await this.user.find({ id: userId });
    if (!user) throw new AuthError('USER/UNAUTHENTICATED');

    // Compare token payload with DB
    // Check user group and isAdmin
    if (payload.group !== user.group?.id || payload.isAdmin !== user.isAdmin) {
      throw new AuthError('USER/UNAUTHENTICATED');
    }
    // Check token issued time
    let iat: number | undefined = undefined;
    switch (type) {
      case 'r':
        iat = user.auth?.sigmateRefreshTokenIat;
        break;
      case 'a':
        iat = user.auth?.sigmateAccessTokenIat;
        break;
      default:
        iat = undefined;
        break;
    }
    if (!iat || payload.iat !== iat) {
      throw new AuthError('USER/UNAUTHENTICATED');
    }

    // Auth success! Set user.
    this.user.user = user;
  }
}
