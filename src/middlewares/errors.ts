import { ErrorRequestHandler } from 'express';
import ServerError from '../services/errors/ServerError';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultHandler: ErrorRequestHandler = (err, req, res, next) => {
  const error =
    err instanceof ServerError
      ? err
      : new ServerError({
          name: 'ServerError',
          code: 'UNKNOWN/ER_UNHANDLED',
          error: err,
          label: {
            source: 'SERVER',
            name: 'APP',
          },
          message: err?.message || 'Unexpected internal server error',
          httpStatus: 500,
        });

  res.status(error.httpStatus).json({
    success: false,
    error: {
      code: error.code,
      msg: error.message,
    },
    validationErrors: error.validationErrors,
    fields: error.fields,
  });

  req.service.logger?.log({ error });
};

const errorMw = {
  defaultHandler,
};

export default errorMw;
