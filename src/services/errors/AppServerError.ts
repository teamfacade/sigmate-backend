import { AppServerErrorCode } from '.';
import ServerError, { ServerErrorOptions } from './ServerError';

export default class AppServerError extends ServerError<AppServerErrorCode> {
  constructor(options: ServerErrorOptions<AppServerErrorCode>) {
    super({ ...options, name: 'AppServerError' });
  }
}
