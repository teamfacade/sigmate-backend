export interface ApiErrorOptions {
  status?: number;
  clientMessage?: string;
  origin?: Error;
}

export default class ApiError extends Error {
  /**
   * HTTP status code to be sent to the client
   */
  public status: number;
  /**
   * Error message to be sent to the client. This property is used to preserve the value of the message property for logging purposes, which may contain the original error message.
   */
  public clientMessage: string;

  /**
   * If this error was created because of another Error, store the orignal Error object here.
   */
  public origin: Error | undefined;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.status = options.status || 500;
    this.clientMessage = options.clientMessage || 'ERR';
    this.origin = options.origin;
  }
}
