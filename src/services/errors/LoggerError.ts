import { LoggerErrorCode } from '.';
import { ServerErrorOptions } from './ServerError';
import ServiceError from './ServiceError';

export default class LoggerError extends ServiceError<LoggerErrorCode> {
  constructor(options: ServerErrorOptions<LoggerErrorCode>) {
    super({ ...options, name: 'LoggerError' });
  }
}
