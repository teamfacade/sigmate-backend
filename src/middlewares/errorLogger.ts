import { NextFunction, Request, Response } from 'express';
import ApiError from '../utils/errors/ApiError';

const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log only unexpected errors
  if (err instanceof ApiError) {
    if (err.status === 500 || process.env.NODE_ENV === 'development')
      console.error(err);
  } else {
    console.error(err);
  }
  next(err);
};

export default errorLogger;
