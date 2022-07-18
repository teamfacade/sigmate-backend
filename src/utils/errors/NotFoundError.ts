import ApiError, { ApiErrorOptions } from './ApiError';

export default class NotFoundError extends ApiError {
  constructor(
    message = 'ERR_NOT_FOUND',
    options: ApiErrorOptions = {
      status: 404,
    }
  ) {
    super(message, options);
  }
}
