import ServerError from './ServerError';

type LoggerErrorOptions = Omit<sigmate.Error.ServerErrorOptions, 'name'>;

export default class LoggerError extends ServerError {
  constructor(options: LoggerErrorOptions) {
    super({
      name: 'LoggerError',
      ...options,
    });
  }
}
