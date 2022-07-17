import {
  Strategy as JwtStrategy,
  ExtractJwt,
  VerifiedCallback,
} from 'passport-jwt';
import {
  JWT_ALG,
  JWT_ISS,
  JWT_TYP_ACCESS,
  getECPublicKey,
} from '../services/auth/token';
import { findUserByAccessToken } from '../services/user/findUser';
import { Request } from 'express';

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
      console.error(error); // TODO handle user search error
      done(error);
    }
  }
);

export default jwtStrategy;
