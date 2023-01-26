import { AccountErrorCode } from '.';
import { ServerErrorOptions } from './ServerError';
import ServiceError from './ServiceError';

export default class AccountError extends ServiceError<AccountErrorCode> {
  constructor(options: ServerErrorOptions<AccountErrorCode>) {
    super({ ...options, name: 'AccountError' });
  }
}
