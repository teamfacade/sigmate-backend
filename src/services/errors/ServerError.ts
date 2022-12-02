import Server from '../servers/Server';

export default class ServerError extends Error {
  static server: Server;
  server = ServerError.server;
  /** Name of the error. Used to classify errors in logging */
  name: string;
  /**
   * The original error that caused this ServerError.
   * When set, the stack of this Error will also be logged.
   */
  cause?: unknown;
  /**
   * Setting this attribute true signifies that this error is
   * irrecoverable, and the Server, Service, Request, or Action
   * needs to fail, and shut down.
   */
  critical = false;
  /**
   * Log level to override the default settings
   */
  level: sigmate.Logger.Level;

  constructor(options: sigmate.Error.ServerErrorOptions) {
    const { name, message, critical, cause, level } = options;
    super(message);
    this.name = name;
    this.critical = critical || false;
    this.level = level || (critical ? 'error' : 'warn');
    if (cause) this.cause = cause;
  }
}
