import { ValidationError } from 'express-validator';
import ApiError from './ApiError';

class InvalidRequestError extends ApiError {
  /**
   * Detailed error messages for invalid fields of a form
   */
  public formMessages!: ValidationError[];

  constructor(
    formMessages: ValidationError[] = [],
    message = 'ERR_INVALID_REQUEST',
    status = 400
  ) {
    super(message, status);
    this.formMessages = formMessages;
    this.status = status;
  }
}

export default InvalidRequestError;
