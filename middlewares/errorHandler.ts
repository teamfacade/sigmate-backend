import { NextFunction, Request, Response } from 'express';
import { getNodeEnv } from '../config';

export interface ErrorResponse {
  success: false;
  message: string;
}

const DEFAULT_ERR_MESSAGE = 'Unexpected server error.';
const env = getNodeEnv();

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Send the response
  const status = 500;
  const message =
    env === 'development' && err.message ? err.message : DEFAULT_ERR_MESSAGE;
  const errorResponse: ErrorResponse = {
    success: false,
    message,
  };
  res.status(status).json(errorResponse);
};

export default errorHandler;
