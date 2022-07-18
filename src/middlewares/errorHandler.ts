import { NextFunction, Request, Response } from 'express';

export interface ErrorResponse {
  success: false;
  message: string;
}

const env = process.env.NODE_ENV;
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
  const message =
    env === 'development' && err.message ? err.message : DEFAULT_ERR_MESSAGE;
  const errorResponse: ErrorResponse = { success: false, message };

  res.status(status).json(errorResponse);
};

export default errorHandler;
