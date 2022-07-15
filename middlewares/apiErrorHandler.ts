import { NextFunction, Request, Response } from 'express';
import { ValidationError } from 'express-validator';
import { getNodeEnv } from '../config';
import { ErrorResponse } from './errorHandler';

export interface APIError extends Error {
  /**
   * HTTP status code to be sent to the client
   */
  status?: number;
  /**
   * Detailed explanation of the error, in case the message property is already set.
   * If both message and cause is set, the message will be replaced by the cause before being sent to the client.
   */
  cause?: string;
  /**
   * Detailed error messages for invalid fields of a form
   */
  formMessages?: ValidationError[];
}

export interface APIErrorResponse extends ErrorResponse {
  formMessages?: ValidationError[];
}

const env = getNodeEnv();
const DEFAULT_ERR_MESSAGE = 'Unexpected API error.';

const apiErrorHandler = (
  err: APIError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If both message and cause is set, replace message with cause
  // and remove cause
  if (err.cause && err.message) {
    err.message = err.cause;
    delete err.cause;
  }

  // No status attrib? Unexpected error.
  if (!err.status) {
    next(err);
    return;
  }

  // Create the error response
  const status = err.status || 500;
  const message =
    env === 'development' && err.message ? err.message : DEFAULT_ERR_MESSAGE;
  const apiErrorResponse: APIErrorResponse = {
    success: false,
    message,
  };

  // Multiple error messages for each form field
  if (err.formMessages) {
    apiErrorResponse.formMessages = err.formMessages;
  }

  // Send the error response to client
  res.status(status).json(apiErrorResponse);
};

export default apiErrorHandler;
