import { ValidationError } from 'express-validator';
import ApiError, { ApiErrorOptions } from './ApiError';

export interface BadRequestErrorOptions extends ApiErrorOptions {
  validationErrors?: (Partial<ValidationError> & { data?: any })[];
}

export default class BadRequestError extends ApiError {
  public validationErrors: Partial<ValidationError>[] | undefined;

  constructor(
    options: BadRequestErrorOptions = {
      status: 400,
    },
    message = 'ERR_BAD_REQUEST'
  ) {
    super(message, {
      status: options.status || 400,
      clientMessage: options.clientMessage,
      origin: options.origin,
    });
    this.validationErrors = options.validationErrors;
  }
}
