import jwt from 'jsonwebtoken';
import {
  ExtractJwt,
  Strategy as JwtStrategy,
  VerifiedCallback,
} from 'passport-jwt';
import { readFileSync } from 'fs';
import { Request } from 'express';
import isInt from 'validator/lib/isInt';
import BaseService from '../base/BaseService';
import User from '../../../models/User.model';
import UserDevice from '../../../models/UserDevice.model';

type SigmateJwtPayload = sigmate.Auth.JwtPayload & jwt.JwtPayload;

export default class AuthService extends BaseService {
  /** JWT signing algorithm */
  protected static JWT_ALG = 'ES256';
  /** JWT issuer */
  protected static JWT_ISS = 'sigmate.io';
  /** JWT expiration time for Sigmate access token */
  protected static JWT_EXP_ACC = '1h';
  /** JWT expiration time for Sigmate refresh token */
  protected static JWT_EXP_REF = '30d';
  /** Token type for Sigmate access token */
  protected static JWT_TOK_ACC = 'a';
  /** Token type for Sigmate refresh token */
  protected static JWT_TOK_REF = 'r';
  /** Public key for verifying tokens */
  protected static ecPublicKey?: Buffer;
  /** Private key for signing tokens */
  protected static ecPrivateKey?: Buffer;

  static started = false;

  static start() {
    this.loadKeys();
    this.started = true;
  }

  /**
   * Loads the public and private key from file
   */
  public static loadKeys() {
    if (this.isKeysLoaded) return;
    this.ecPrivateKey = readFileSync(process.env.PATH_PRIVATE_KEY);
    this.ecPublicKey = readFileSync(process.env.PATH_PUBLIC_KEY);
  }

  /**
   * Check if both public and private keys have been loaded
   */
  protected static get isKeysLoaded(): boolean {
    return (
      Boolean(AuthService.ecPublicKey) && Boolean(AuthService.ecPrivateKey)
    );
  }

  private static __PASSPORT_STRATEGY_JWT?: JwtStrategy;
  /** Strategy for the `passport` library to use JWT */
  public static get PASSPORT_STRATEGY_JWT() {
    if (!AuthService.started) {
      throw new Error('AuthService not started');
    }

    this.__PASSPORT_STRATEGY_JWT = new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: this.ecPrivateKey,
        issuer: this.JWT_ISS,
        algorithms: [this.JWT_ALG],
        passReqToCallback: true,
      },
      async (
        req: Request,
        payload: SigmateJwtPayload,
        done: VerifiedCallback
      ) => {
        try {
          const { tok, sub, group, isAdmin } = payload;
          const isAccessToken = tok === this.JWT_TOK_ACC;
          const isSubjectSet = sub && isInt(sub);
          if (isAccessToken && isSubjectSet) {
            done(null, { id: Number.parseInt(sub), group, isAdmin });
          } else {
            done(null, false);
          }
        } catch (error) {
          done(error);
        }
      }
    );

    return this.__PASSPORT_STRATEGY_JWT;
  }

  user: any;
  device: any;

  constructor(user: User, device: UserDevice) {
    super();
    this.user = user;
    this.device = device;
  }
}
