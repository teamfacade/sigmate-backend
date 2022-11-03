import ServerError from './ServerError';

export default class AppServerError extends ServerError {
  /** Error messages */
  static MESSAGES = {
    'START/3P': 'ERR_SERVER_START_3P',
    'START/AUTH': 'ERR_SERVER_START_AUTH',
    'START/DB': 'ERR_SERVER_START_DB',
    'START/SERVICES': 'ERR_SERVER_START_SERVICES',
    'START/OTHER': 'ERR_SERVER_START_OTHER',
  };

  constructor(
    message: keyof typeof AppServerError['MESSAGES'],
    origin: unknown = undefined
  ) {
    // Call the constructor of `ServerError`
    super(AppServerError.MESSAGES[message], {
      name: 'AppServerError',
      origin,
    });

    switch (message) {
      case 'START/3P':
      case 'START/AUTH':
      case 'START/DB':
      case 'START/SERVICES':
        this.unexpected = true;
        break;
      default:
        this.unexpected = this.isUnexpectedError(message);
    }
  }
}
