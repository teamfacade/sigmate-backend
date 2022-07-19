import ApiError, { ApiErrorOptions } from './ApiError';

export default class MethodNotAllowedError extends ApiError {
  constructor(
    message = 'ERR_METHOD_NOT_ALLOWED',
    options: ApiErrorOptions = { status: 405 }
  ) {
    super(message, {
      ...options,
      status: options.status || 405,
    });
  }
}
