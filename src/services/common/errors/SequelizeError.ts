import {
  AccessDeniedError,
  BaseError,
  ConnectionError,
  EmptyResultError,
  ForeignKeyConstraintError,
  InvalidConnectionError,
  TimeoutError,
  UniqueConstraintError,
  ValidationError,
  ValidationErrorItem,
} from 'sequelize';
import { ValidationError as ExpressValidationErrorItem } from 'express-validator';
import RequestError from './RequestError';
import ServerError from './ServerError';
import { camelize } from 'inflection';

type HttpStatusCode = keyof typeof RequestError['HTTP_ERR_STATUS'];
type SequelizeValidationErrorItem = Omit<
  ExpressValidationErrorItem,
  'location'
>;

export default class SequelizeError extends ServerError {
  static MESSAGES = {
    INIT: 'ERR_DB_INIT',
    'CONN/ACCESS_DENIED': 'ERR_DB_CONNECT_ACCESS_DENIED',
    'CONN/INVALID': 'ERR_DB_CONNECT_INVALID_CONN',
    'CONN/FAIL': 'ERR_DB_CONNECT_FAIL',
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
  validationErrors?: SequelizeValidationErrorItem[];
  fields?: string[];

  constructor(
    origin: unknown | undefined,
    message: keyof typeof SequelizeError['MESSAGES'] = 'DEFAULT'
  ) {
    super('', { name: 'SequelizeError', origin });
    this.statusCode = 500;

    if (message === 'DEFAULT') {
      if (origin instanceof BaseError) {
        if (origin instanceof AccessDeniedError) {
          // Thrown when a connection to a database is refused due to
          // insufficient privileges (Auth fail)
          message = 'CONN/ACCESS_DENIED';
          this.statusCode = 403;
        } else if (origin instanceof InvalidConnectionError) {
          // Thrown when a connection to a database has invalid values
          // for any of the connection parameters
          message = 'CONN/INVALID';
          this.statusCode = 500;
        } else if (origin instanceof ConnectionError) {
          // Connection failed due to other reasons: ConnectionAcquireTimeOut,
          // ConnectionRefused, ConnectionTimedOut, HostNotFound, HostNotReachable
          message = 'CONN/FAIL';
          this.statusCode = 503;
        } else if (origin instanceof UniqueConstraintError) {
          message = 'CSTR/UNIQUE';
          this.statusCode = 409;
          this.validationErrors = this.mapValidationErrors(origin.errors);
        } else if (origin instanceof ValidationError) {
          // Includes notnull constraint violation
          message = 'VALIDATION';
          this.statusCode = 400;
          this.validationErrors = this.mapValidationErrors(origin.errors);
        } else if (origin instanceof ForeignKeyConstraintError) {
          message = 'CSTR/FOREIGN';
          this.statusCode = 409;
          this.fields = this.camelizeFields(origin.fields);
        } else if (origin instanceof TimeoutError) {
          message = 'TIMEOUT';
          this.statusCode = 408;
        } else if (origin instanceof EmptyResultError) {
          message = 'EMPTY_RESULT';
          this.statusCode = 404;
        }
      } else {
        message = 'OTHER';
      }
    }

    if (message in SequelizeError.MESSAGES) {
      this.message = SequelizeError.MESSAGES[message];
    }

    this.unexpected = this.isUnexpectedError(message);
  }

  mapValidationErrors(
    errors: ValidationErrorItem[]
  ): SequelizeValidationErrorItem[] {
    return errors.map((item) => {
      const { message, type, path, value } = item;

      return {
        msg: `${type}: ${message}`,
        value,
        param: path ? camelize(path, true) : '',
      };
    });
  }

  camelizeFields(fields: string[] | { [fields: string]: string } | undefined) {
    if (!fields) {
      return [];
    }
    if (fields instanceof Array) {
      return fields.map((f) => camelize(f, true));
    }
    return Object.keys(fields).map((f) => camelize(f, true));
  }
}
