import { Request, Response, NextFunction } from 'express';
import { getNodeEnv } from '../config';
import { APIError } from './apiErrorHandler';

const env = getNodeEnv();

const errorLogger = (
  err: APIError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  env === 'development' && console.error(err);
  next(err);
};

export default errorLogger;
