import RequestError, { RequestErrorOptions } from '.';

interface AuthErrorOptions extends RequestErrorOptions {
  status?: 401 | 403;
}

export default class AuthError extends RequestError {
  constructor(options: AuthErrorOptions = {}) {
    const {
      status = 401,
      clientMessage,
      level = 'http',
      origin,
      message,
    } = options;
    super({ status, clientMessage, level, origin, message });
  }
}
