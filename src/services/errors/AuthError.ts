import { AllErrorCode, AuthErrorCode } from '.';
import { ServerErrorOptions } from './ServerError';
import ServiceError from './ServiceError';

export default class AuthError<
  ErrorCode extends AllErrorCode = AuthErrorCode
> extends ServiceError<ErrorCode> {
  constructor(options: ServerErrorOptions<ErrorCode>) {
    super({ ...options, name: options.name || 'Auth' });
  }
}
