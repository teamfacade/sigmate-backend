import { GoogleAuthErrorCode } from '.';
import AuthError from './AuthError';
import { ServerErrorOptions } from './ServerError';

export default class GoogleAuthError extends AuthError<GoogleAuthErrorCode> {
  constructor(options: ServerErrorOptions<GoogleAuthErrorCode>) {
    super({ ...options, name: 'GoogleAuthError' });
  }
}
