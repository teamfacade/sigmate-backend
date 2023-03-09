import {
  AccessDeniedError,
  BaseError,
  ConnectionError,
  ConnectionTimedOutError,
  EmptyResultError,
  ForeignKeyConstraintError,
  InvalidConnectionError,
  TimeoutError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';
import ServerError from '.';

type ErrorCode =
  | 'DB/SEQ/ACCESS_DENIED'
  | 'DB/SEQ/INVALID_CONN'
  | 'DB/SEQ/CONN_TIMEOUT'
  | 'DB/SEQ/CONN'
  | 'DB/SEQ/UNIQUE_CSTR'
  | 'DB/SEQ/VALIDATION'
  | 'DB/SEQ/FK_CSTR'
  | 'DB/SEQ/TIMEOUT'
  | 'DB/SEQ/EMPTY_RESULT'
  | 'DB/SEQ/OTHER';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'DB/SEQ/ACCESS_DENIED': {
    httpCode: 403,
    message: 'Database connection access denied',
    critical: true,
  },
  'DB/SEQ/INVALID_CONN': {
    message: 'Database connection invalid',
    critical: true,
  },
  'DB/SEQ/CONN_TIMEOUT': {
    logLevel: 'warn',
    httpCode: 408,
    message: 'Database connection timed out',
    critical: true,
  },
  // Connection failed due to other reasons:
  // ConnectionAcquireTimeOut, ConnectionRefused, HostNotFound, HostNotReachable
  'DB/SEQ/CONN': {
    logLevel: 'warn',
    httpCode: 503,
    message: 'Database connection failed',
    critical: true,
  },
  'DB/SEQ/UNIQUE_CSTR': {
    logLevel: 'debug',
    httpCode: 409,
    message: 'SQL Unique constraint violation',
  },
  'DB/SEQ/VALIDATION': {
    logLevel: 'debug',
    httpCode: 400,
    message: 'Invalid value',
  },
  'DB/SEQ/FK_CSTR': {
    logLevel: 'debug',
    httpCode: 409,
    message: 'SQL Foreign key constraint violation',
  },
  'DB/SEQ/TIMEOUT': {
    logLevel: 'warn',
    httpCode: 408,
    message: 'Database timed out',
  },
  'DB/SEQ/EMPTY_RESULT': {
    logLevel: 'debug',
    httpCode: 404,
    message: 'Query result empty',
  },
  'DB/SEQ/OTHER': {
    message: 'Unexpected error',
  },
};

export default class DatabaseError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    const serverErrorOptions = ServerError.parseOptions(
      'DatabaseError',
      options,
      defaultsMap
    );

    let code = serverErrorOptions.code;
    const cause = serverErrorOptions.error;

    if (!code && cause instanceof BaseError) {
      if (cause instanceof AccessDeniedError) {
        code = 'DB/SEQ/ACCESS_DENIED';
      } else if (cause instanceof InvalidConnectionError) {
        code = 'DB/SEQ/INVALID_CONN';
      } else if (cause instanceof ConnectionTimedOutError) {
        code = 'DB/SEQ/CONN_TIMEOUT';
      } else if (cause instanceof ConnectionError) {
        code = 'DB/SEQ/CONN';
      } else if (cause instanceof UniqueConstraintError) {
        code = 'DB/SEQ/UNIQUE_CSTR';
      } else if (cause instanceof ValidationError) {
        code = 'DB/SEQ/VALIDATION';
      } else if (cause instanceof ForeignKeyConstraintError) {
        code = 'DB/SEQ/FK_CSTR';
      } else if (cause instanceof TimeoutError) {
        code = 'DB/SEQ/TIMEOUT';
      } else if (cause instanceof EmptyResultError) {
        code = 'DB/SEQ/EMPTY_RESULT';
      } else {
        code = 'DB/SEQ/OTHER';
      }
      serverErrorOptions.code = code;
    }

    super(serverErrorOptions);
  }
}
