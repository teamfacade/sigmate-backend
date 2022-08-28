import {
  ExtractJwt,
  Strategy as JwtStrategy,
  VerifiedCallback,
} from 'passport-jwt';
import {
  getECPublicKey,
  JWT_ALG,
  JWT_ISS,
  JWT_TYP_ACCESS,
} from '../auth/token';
import { Request } from 'express';
import { findUserByAccessToken } from '../database/auth';

const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: getECPublicKey(),
    issuer: JWT_ISS,
    algorithms: [JWT_ALG],
    passReqToCallback: true,
  },
  async (req: Request, payload: any, done: VerifiedCallback) => {
    const { tok } = payload;
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    try {
      if (token && tok === JWT_TYP_ACCESS) {
        const user = await findUserByAccessToken(token);
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  }
);

export default jwtStrategy;
