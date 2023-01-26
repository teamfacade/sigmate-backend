import { ActionErrorCode } from '.';
import ServerError, { ServerErrorOptions } from './ServerError';

export default class ActionError extends ServerError {
  constructor(options: ServerErrorOptions<ActionErrorCode>) {
    super({ ...options, name: 'ActionError' });
  }
}
