import { Request, Response, NextFunction, RequestHandler } from 'express';
import { FindOptions } from 'sequelize/types';
import RequestError from '../errors/request';
import { UserAttribs } from '../models/User.model';
import { auth } from '../services/auth';

type AuthGuardOptions = {
  login?: 'required' | 'optional';
  findOptions?: FindOptions<UserAttribs>;
};

export default class AuthMiddleware {
  static BEARER = /Bearer (?<token>.*)/;

  public static authenticate = (
    required = false,
    findOptions?: FindOptions<UserAttribs>
  ): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get HTTP Authorization header value
        const authHeader = req.header('Authorization');
        if (!authHeader || typeof authHeader !== 'string') return next();

        // Check if it contains bearer token
        const bearer = AuthMiddleware.BEARER.exec(authHeader);
        if (!bearer || !bearer.groups) return next();
        const token = bearer.groups.token;
        if (!token) return next();

        // Attempt to authenticate
        const user = await auth.authenticate({
          token: { access: token },
          findOptions,
        });
        if (user) req.user = user;
        else if (required) throw new RequestError('REQ/RJ_UNAUTHENTICATED');
        next();
      } catch (error) {
        next(error);
      }
    };
  };

  public static isLoggedIn(req: Request, res: Response, next: NextFunction) {
    if (req.user) next();
    else next(new RequestError('REQ/RJ_UNAUTHENTICATED'));
  }

  public static isNotLoggedIn(req: Request, res: Response, next: NextFunction) {
    if (!req.user) next();
    else next(new RequestError('REQ/RJ_UNAUTHENTICATED'));
  }
}

function __AuthGuard(options: AuthGuardOptions = { login: 'optional' }) {
  return (target: any, key: string, desc?: PropertyDescriptor) => {
    const method = desc?.value || target[key];
    const controllers: RequestHandler[] = [];
    if (options.login) {
      controllers.push(
        AuthMiddleware.authenticate(
          options.login === 'required',
          options.findOptions
        )
      );
    }
    if (method instanceof Array) {
      controllers.concat(method);
    } else {
      controllers.push(method);
    }
    desc?.value ? (desc.value = controllers) : (target[key] = controllers);
  };
}

export function AuthGuard(options: AuthGuardOptions): void | any;
export function AuthGuard(
  target: any,
  key: string,
  desc?: PropertyDescriptor
): void | any;
export function AuthGuard(...args: any[]) {
  if (args.length >= 2) {
    __AuthGuard()(args[0], args[1], args[2]);
    return;
  }
  return (target: any, key: string, desc?: PropertyDescriptor) => {
    __AuthGuard(args[0])(target, key, desc);
  };
}
