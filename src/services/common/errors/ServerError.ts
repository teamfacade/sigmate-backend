type ServerErrorOptions = sigmate.Errors.ServerErrorOptions;

/**
 * Base class of all errors thrown by a Sigmate server
 */
export default class ServerError extends Error {
  /**
   * Contains the original Error object, or the cause of this ServerError
   * If the origin property is present (truthy), and the unexpected property
   * is not already set, the unexpected property will be set to true
   */
  origin?: ServerErrorOptions['origin'];
  /**
   * Indicates whether the error was thrown due to an unexpected reason.
   * This is used by LoggerService to log the error accordingly.
   */
  unexpected?: ServerErrorOptions['unexpected'] = false;

  constructor(
    message: string,
    options: ServerErrorOptions = { name: 'ServerError' }
  ) {
    super(message);

    // Store options
    const { origin, unexpected, name = 'ServerError' } = options;
    this.name = name;
    this.origin = origin;
    this.unexpected = unexpected;
  }

  isUnexpectedError(message: string) {
    return message.indexOf('OTHER') >= 0;
  }
}
