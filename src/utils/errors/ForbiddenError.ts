import ApiError, { ApiErrorOptions } from './ApiError';

export default class ForbiddenError extends ApiError {
  constructor(
    message = 'ERR_FORBIDDEN',
    options: ApiErrorOptions = { status: 403 }
  ) {
    super(message, options);
  }
}
