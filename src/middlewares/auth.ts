import { RequestHandler } from 'express';

export default class AuthMiddleware {
  static isAuthenticated: RequestHandler = (req, res, next) => {
    if (req.user?.id) next();
    else res.status(401).send(); // TODO error response
  };

  static isUnauthenticated: RequestHandler = (req, res, next) => {
    if (!req.user?.id) next();
    else res.status(401).send(); // TODO error response
  };

  static jwt: RequestHandler = (req, res, next) => {};
}
