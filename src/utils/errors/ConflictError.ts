import { ValidationError } from 'express-validator';
import ApiError, { ApiErrorOptions } from './ApiError';

export interface ConflictErrorOptions extends ApiErrorOptions {
  conflictErrors?: Partial<ValidationError>[];
}

export default class ConflictError extends ApiError {
  public conflictErrors: Partial<ValidationError>[] | undefined;
  constructor(
    message = 'ERR_CONFLICT',
    options: ConflictErrorOptions = { status: 409 }
  ) {
    super(message, {
      status: options.status || 409,
      clientMessage: options.clientMessage,
      origin: options.origin,
    });
    this.conflictErrors = options.conflictErrors;
  }
}
