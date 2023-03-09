import { ErrorRequestHandler } from 'express';
import ServerError from '../errors';
import ActionError from '../errors/action';
import RequestError from '../errors/request';

export default class ErrorMw {
  /**
   * Error handling middleware to parse error information and send them to the client.
   * Details of errors with the `secure` flag set are not sent to the client, but stored written to logs.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static request: ErrorRequestHandler = async (err, req, res, next) => {
    if (req.meta) req.meta.error = err;

    const env = process.env.NODE_ENV || 'production';
    let error: ServerError;
    if (err instanceof Error) {
      if (err instanceof ServerError) {
        if (err instanceof ActionError) {
          error = err.cause instanceof ServerError ? err.cause : err;
        } else {
          error = err;
        }
      } else {
        error = new RequestError({
          code: 'REQ/ER_UNCAUGHT',
          error: err,
          // (Security) Do not send uncaught error details to client in production
          secure: env === 'production',
        });
      }
    } else {
      error = new RequestError({
        code: 'REQ/ER_UNCAUGHT',
        message: String(err),
        // (Security) Do not send uncaught error details to client in production
        secure: env === 'production',
      });
    }

    // Construct error response
    let code = error.code;
    let message = error.message;

    // Details of errors with the secure flag set are
    // only sent to the client in development environments
    if (error.secure && env !== 'development') {
      code = 'REQ/OTHER';
      message = 'Error';
    }

    res.error = { code, message };

    // Send secure error details to client in development mode
    res.status(error.httpCode || 500).json({ ...res.meta() });
  };
}
