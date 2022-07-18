import { NextFunction, Request, Response } from 'express';
import { ValidationError } from 'express-validator';
import ApiError from '../utils/errors/ApiError';
import BadRequestError from '../utils/errors/BadRequestError';
import ConflictError from '../utils/errors/ConflictError';
import { DEFAULT_ERR_MESSAGE, ErrorResponse } from './errorHandler';

interface ApiErrorResponse extends ErrorResponse {
  message: string;
  validationErrors?: Partial<ValidationError>[];
  conflictErrors?: Partial<ValidationError>[];
}

const apiErrorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!(err instanceof ApiError)) return next(err); // errorHandler

  const status = err.status || 500;
  const message =
    err.clientMessage || (err.message ? err.message : DEFAULT_ERR_MESSAGE);

  const apiErrorResponse: ApiErrorResponse = { message };
  if (err instanceof BadRequestError) {
    apiErrorResponse.validationErrors = err.validationErrors;
  } else if (err instanceof ConflictError) {
    apiErrorResponse.conflictErrors = err.conflictErrors;
  }

  res.status(status).json(apiErrorResponse);
};

export default apiErrorHandler;
