import ApiError from './ApiError';

class NotFoundError extends ApiError {
  constructor(message = 'ERR_NOT_FOUND') {
    super(message, 404);
  }
}

export default NotFoundError;
