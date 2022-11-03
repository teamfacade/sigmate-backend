import {
  AccessDeniedError,
  BaseError,
  ConnectionRefusedError,
  EmptyResultError,
  ForeignKeyConstraintError,
  InvalidConnectionError,
  TimeoutError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';
import RequestError from './RequestError';
import ServerError from './ServerError';

type HttpStatusCode = keyof typeof RequestError['HTTP_ERR_STATUS'];

export default class SequelizeError extends ServerError {
  static MESSAGES = {
    INIT: 'ERR_DB_INIT',
    'CONN/ACCESS_DENIED': 'ERR_DB_CONNECT_ACCESS_DENIED',
    'CONN/CONN_REFUSED': 'ERR_DB_CONNECT_CONN_REFUSED',
    'CONN/INVALID_CONN': 'ERR_DB_CONNECT_INVALID_CONN',
    'CSTR/UNIQUE': 'ERR_DB_UNIQUE_CONSTRAINT',
    'CSTR/FOREIGN': 'ERR_DB_FOREIGN_KEY_CONSTRAINT',
    TIMEOUT: 'ERR_DB_TIMEOUT',
    EMPTY_RESULT: 'ERR_DB_EMPTY_RESULT',
    VALIDATION: 'ERR_DB_VALIDATION',
    OTHER: 'ERR_DB_OTHER',
    DEFAULT: 'ERR_DB_DEFAULT',
  };

  /** HTTP response status code to use when generating a RequestError */
  statusCode: HttpStatusCode;

  constructor(
    origin: unknown | undefined,
    message: keyof typeof SequelizeError['MESSAGES'] = 'DEFAULT'
  ) {
    let msg: string = message;
    let statusCode: HttpStatusCode = 500;
    if (message === 'DEFAULT') {
      if (origin instanceof BaseError) {
        if (origin instanceof AccessDeniedError) {
          message = 'CONN/ACCESS_DENIED';
          statusCode = 403;
        } else if (origin instanceof ConnectionRefusedError) {
          message = 'CONN/CONN_REFUSED';
          statusCode = 403;
        } else if (origin instanceof InvalidConnectionError) {
          message = 'CONN/INVALID_CONN';
          statusCode = 403;
        } else if (origin instanceof UniqueConstraintError) {
          message = 'CSTR/UNIQUE';
          statusCode = 409;
        } else if (origin instanceof ValidationError) {
          message = 'VALIDATION';
          statusCode = 400;
        } else if (origin instanceof ForeignKeyConstraintError) {
          message = 'CSTR/FOREIGN';
          statusCode = 409;
        } else if (origin instanceof TimeoutError) {
          message = 'TIMEOUT';
          statusCode = 408;
        } else if (origin instanceof EmptyResultError) {
          message = 'EMPTY_RESULT';
          statusCode = 404;
        }
      } else {
        message = 'OTHER';
      }
      msg = SequelizeError.MESSAGES[message];
    }

    super(msg, {
      name: 'SequelizeError',
      origin,
    });
    this.unexpected = this.isUnexpectedError(message);
    this.statusCode = statusCode;
  }
}
