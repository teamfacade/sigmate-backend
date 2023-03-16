import { ErrorRequestHandler } from 'express';
import ServerError from '../errors';
import ActionError from '../errors/action';
import DatabaseError from '../errors/database';
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
          if (err.cause instanceof ServerError) {
            error = err.cause;
          } else {
            error = new RequestError({
              code: 'REQ/ER_OTHER',
              error: err.cause,
              secure: env !== 'development',
            });
          }
        } else if (err instanceof DatabaseError) {
          // Details of database errors should not be sent to the client
          err.secure = env !== 'development';
          error = err;
        } else {
          error = err;
        }
      } else {
        error = new RequestError({
          code: 'REQ/ER_UNCAUGHT',
          error: err,
          // (Security) Do not send uncaught error details to client in production
          secure: env !== 'development',
        });
      }
    } else {
      error = new RequestError({
        code: 'REQ/ER_UNCAUGHT',
        message: String(err),
        // (Security) Do not send uncaught error details to client in production
        secure: env !== 'development',
      });
    }

    // Construct error response
    let code = error.code;
    let message = (error.name || 'Error') + ': ' + error.message;
    let cause: sigmate.ResErr['cause'] = undefined;
    const validationErrors =
      error instanceof RequestError ? error.validationErrors : undefined;

    if (error instanceof ServerError && error.cause) {
      const code =
        error.cause instanceof ServerError ? error.cause.code : undefined;
      const message =
        error.cause instanceof Error
          ? `${error.cause.name}: ${error.cause.message}`
          : String(error);
      cause = { code, message };
    }

    // Details of errors with the secure flag set are
    // only sent to the client in development environments
    if (error.secure && env !== 'development') {
      code = 'REQ/OTHER';
      message = 'Error';
      cause = undefined;
    }

    res.error = { code, message, cause, validationErrors };

    // Send secure error details to client in development mode
    if (!res.headersSent) {
      res
        .status(error.httpCode || 500)
        .json({ meta: res.meta(), success: false });
    } else {
      if (!res.writableEnded) res.end();
    }
  };
}
