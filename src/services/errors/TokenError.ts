import { TokenErrorCode } from '.';
import AuthError from './AuthError';
import { ServerErrorOptions } from './ServerError';

export default class TokenError extends AuthError<TokenErrorCode> {
  constructor(options: ServerErrorOptions<TokenErrorCode>) {
    super({ ...options, name: 'TokenError' });
  }
}
