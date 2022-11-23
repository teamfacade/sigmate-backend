import { NextFunction, Request, Response } from 'express';
import ApiError from '../utils/errors/ApiError';

export interface ErrorResponse {
  success: false;
  message: string;
}

export const DEFAULT_ERR_MESSAGE = 'ERR';

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // Express error handler middleware requries 4 params
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const status = 500;
  let message = DEFAULT_ERR_MESSAGE;
  if (err instanceof ApiError) {
    message = err.message ? err.message : DEFAULT_ERR_MESSAGE;
  }
  const errorResponse: ErrorResponse = { success: false, message };

  res.status(status).json(errorResponse);
};

export default errorHandler;
