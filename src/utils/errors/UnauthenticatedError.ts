import ApiError, { ApiErrorOptions } from './ApiError';

export default class UnauthenticatedError extends ApiError {
  constructor(
    message = 'ERR_UNAUTHENTICATED',
    options: ApiErrorOptions = { status: 401 }
  ) {
    super(message, options);
  }
}
