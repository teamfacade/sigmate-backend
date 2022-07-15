class ApiError extends Error {
  /**
   * HTTP status code to be sent to the client
   */
  public status: number;
  /**
   * Detailed explanation of the error, in case the message property is already set.
   * If both message and cause is set, the message will be replaced by the cause before being sent to the client.
   */
  public cause: string;

  constructor(message: string, status = 500, cause = '') {
    super(message);
    this.status = status;
    this.cause = cause;
  }
}

export default ApiError;
