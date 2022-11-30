export default class ServerError extends Error {
  /** Name of the error. Used to classify errors in logging */
  name: string;
  /**
   * Unexpected errors that were not handled properly and
   * reached the final error handler
   */
  critical: boolean;
  /**
   * The original error that caused this ServerError.
   * When set, the stack of this Error will also be logged.
   */
  cause?: unknown;
  constructor(options: {
    name: string;
    message: string;
    critical?: boolean;
    cause?: unknown;
  }) {
    const { name, message, critical, cause } = options;
    super(message);
    this.name = name;
    this.critical = critical || false;
    if (cause) this.cause = cause;
  }
}
