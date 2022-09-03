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
import ApiError from './ApiError';

export default class SequelizeError extends ApiError {
  constructor(sequelizeBaseError: Error, clientMessage = 'ERR') {
    if (!(sequelizeBaseError instanceof BaseError)) {
      throw sequelizeBaseError;
    }

    let status = 500;

    if (
      sequelizeBaseError instanceof AccessDeniedError ||
      sequelizeBaseError instanceof ConnectionRefusedError ||
      sequelizeBaseError instanceof InvalidConnectionError
    ) {
      status = 403;
    } else if (
      sequelizeBaseError instanceof UniqueConstraintError ||
      sequelizeBaseError instanceof ValidationError
    ) {
      status = 400;
    } else if (
      sequelizeBaseError instanceof ForeignKeyConstraintError ||
      sequelizeBaseError instanceof TimeoutError
    ) {
      status = 409;
    } else if (sequelizeBaseError instanceof EmptyResultError) {
      status = 404;
    }

    super(clientMessage, { status, clientMessage, origin: sequelizeBaseError });
  }
}
