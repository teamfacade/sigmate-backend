import ServerError from './ServerError';

export default class ActionError extends ServerError {
  constructor(options: sigmate.Errors.ActionErrorOptions) {
    const {
      message = 'ActionError',
      name = 'ActionError',
      origin,
      unexpected,
    } = options;
    super(message, { name, origin, unexpected });
  }
}
