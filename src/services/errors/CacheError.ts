import { CacheErrorCode } from '.';
import { ServerErrorOptions } from './ServerError';
import ServiceError from './ServiceError';

export default class CacheError extends ServiceError<CacheErrorCode> {
  constructor(options: ServerErrorOptions<CacheErrorCode>) {
    super({ ...options, name: 'CacheError' });
  }
}
