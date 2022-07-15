import {
  AccessDeniedError,
  BaseError,
  ConnectionError,
  ConnectionTimedOutError,
  EmptyResultError,
  ForeignKeyConstraintError,
  TimeoutError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';
import ApiError from './ApiError';

class DatabaseError extends ApiError {
  public origin: BaseError;

  constructor(error: BaseError) {
    super(error.message, 500);
    this.name = error.name;
    this.stack = error.stack;
    this.origin = error;

    if (error instanceof AccessDeniedError) {
      this.status = 403;
      this.cause = 'ERR_DB_ACCESS_DENIED';
    } else if (error instanceof EmptyResultError) {
      this.status = 404;
      this.cause = 'ERR_NOT_FOUND';
    } else if (error instanceof ConnectionTimedOutError) {
      this.status = 500;
      this.cause = 'ERR_DB_CONN_TIMEOUT';
    } else if (error instanceof ConnectionError) {
      this.status = 500;
      this.cause = 'ERR_DB_CONN';
    } else if (error instanceof ValidationError) {
      this.status = 400;
      this.cause = 'ERR_INVALID_REQUEST';
    } else if (error instanceof UniqueConstraintError) {
      this.status = 400;
      this.cause = 'ERR_DUPLICATE';
    } else if (error instanceof ForeignKeyConstraintError) {
      this.status = 400;
      this.cause = 'ERR_DB_FK';
    } else if (error instanceof TimeoutError) {
      this.status = 500;
      this.cause = 'ERR_DB_TIMEOUT';
    } else {
      this.status = 500;
      this.cause = 'ERR_DB';
    }
  }
}

export default DatabaseError;
