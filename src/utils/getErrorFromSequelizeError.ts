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
import ApiError from './errors/ApiError';
import BadRequestError from './errors/BadRequestError';
import ConflictError from './errors/ConflictError';
import ForbiddenError from './errors/ForbiddenError';
import NotFoundError from './errors/NotFoundError';

const getErrorFromSequelizeError = (sequelizeError: BaseError) => {
  if (
    sequelizeError instanceof AccessDeniedError ||
    sequelizeError instanceof ConnectionRefusedError ||
    sequelizeError instanceof InvalidConnectionError
  ) {
    return new ForbiddenError('ERR_FORBIDDEN', { origin: sequelizeError });
  } else if (
    sequelizeError instanceof UniqueConstraintError ||
    sequelizeError instanceof ValidationError
  ) {
    return new BadRequestError({ origin: sequelizeError });
  } else if (
    sequelizeError instanceof ForeignKeyConstraintError ||
    sequelizeError instanceof TimeoutError
  ) {
    return new ConflictError('ERR_CONFLICT', { origin: sequelizeError });
  } else if (sequelizeError instanceof EmptyResultError) {
    return new NotFoundError('ERR_NOT_FOUND', { origin: sequelizeError });
  }
  return new ApiError('ERR_DB');
};

export default getErrorFromSequelizeError;
