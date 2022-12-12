import { RequestHandler } from 'express';
import passport from 'passport';
import User from '../services/auth/User';

const passportJwt: RequestHandler = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (user) {
      req.user = user;
    } else {
      req.user = new User();
    }
    next();
  })(req, res, next);
};

const authMw = {
  passportJwt,
};

export default authMw;
