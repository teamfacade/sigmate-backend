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
    console.log(`Extracted token payload: ${JSON.stringify(payload)}`);
    console.log(`Extracted token: ${token}`);
    try {
      if (token && tok === JWT_TYP_ACCESS) {
        const user = await findUserByAccessToken(token);
        if (!user) console.log(`Token auth failed 0`);
        done(null, user);
      } else {
        console.log(`Token auth failed 1`);
        done(null, false);
      }
    } catch (error) {
      console.log(`Token auth failed 2`);
      done(error);
    }
  }
);

export default jwtStrategy;
