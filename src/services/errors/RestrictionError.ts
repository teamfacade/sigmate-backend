import { RestrictionErrorCode } from '.';
import { ServerErrorOptions } from './ServerError';
import ServiceError from './ServiceError';

export default class RestrictionError extends ServiceError<RestrictionErrorCode> {
  constructor(options: ServerErrorOptions<RestrictionErrorCode>) {
    super({ ...options, name: 'RestrictionError' });
  }
}
