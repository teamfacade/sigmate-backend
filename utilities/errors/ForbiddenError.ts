import ApiError from './ApiError';

export default class ForbiddenError extends ApiError {
  constructor(message = 'ERR_TOKEN_INVALID') {
    super(message);
    this.status = 403;
  }
}
