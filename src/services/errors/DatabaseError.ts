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
import { DatabaseErrorCode } from '.';
import { ServerErrorOptions } from './ServerError';
import ServiceError from './ServiceError';

export default class DatabaseError extends ServiceError<DatabaseErrorCode> {
  constructor(options: ServerErrorOptions<DatabaseErrorCode>) {
    let code = options.code;
    if (!code && options.error instanceof BaseError) {
      const cause = options.error;
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
    }
    super({ ...options, name: 'DatabaseError' });
  }
}
