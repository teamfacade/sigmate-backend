import ServerError from './ServerError';

export default class ActionError extends ServerError {
  constructor(options: sigmate.Errors.ActionErrorOptions) {
    let message = options.message;
    const { origin, unexpected } = options;

    if (!message) {
      if (origin instanceof Error) {
        message = `${origin.name}: ${origin.message}`;
      } else {
        message = 'ActionError';
      }
    }

    super(message, { name: 'ActionError', origin, unexpected });
  }
}
