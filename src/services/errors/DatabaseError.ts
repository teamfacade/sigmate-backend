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
  ValidationErrorItem as SequelizeValidationErrorItem,
} from 'sequelize';
import { camelize } from 'inflection';
import RequestError, { ValidationErrorItem } from './RequestError';
import Database from '../Database';

interface DatabaseErrorOptions
  extends Omit<sigmate.Error.ServerErrorOptions, 'name'> {
  database: Database;
}

export default class DatabaseError extends RequestError {
  database: Database;
  constructor(options: DatabaseErrorOptions) {
    const { database, ...rest } = options;
    super({ name: 'DatabaseError', ...rest });
    this.status = 500;
    this.database = database;
    const { cause } = options;
    if (cause instanceof BaseError) {
      let message = options.message;
      if (cause instanceof AccessDeniedError) {
        // Thrown when a connection to a database is refused due to
        // insufficient privileges (Auth fail)
        message = '(Sequelize) Database connection access denied';
        this.status = 403;
      } else if (cause instanceof InvalidConnectionError) {
        // Thrown when a connection to a database has invalid values
        // for any of the connection parameters
        message = '(Sequelize) Database connection invalid';
        this.status = 500;
      } else if (cause instanceof ConnectionError) {
        // Connection failed due to other reasons: ConnectionAcquireTimeOut,
        // ConnectionRefused, ConnectionTimedOut, HostNotFound, HostNotReachable
        message = '(Sequelize) Database connection failed';
        this.status = 503;
      } else if (cause instanceof UniqueConstraintError) {
        message = '(Sequelize) Unique constraint error';
        this.status = 409;
        this.validationErrors = this.mapValidationErrors(cause.errors);
      } else if (cause instanceof ValidationError) {
        // Includes notnull constraint violation
        message = '(Sequelize) Validation error';
        this.status = 400;
        this.validationErrors = this.mapValidationErrors(cause.errors);
      } else if (cause instanceof ForeignKeyConstraintError) {
        message = '(Sequelize) Foreign key constraint error';
        this.status = 409;
        this.fields = this.camelizeFields(cause.fields);
      } else if (cause instanceof TimeoutError) {
        message = '(Sequelize) Timeout error';
        this.status = 408;
      } else if (cause instanceof EmptyResultError) {
        message = '(Sequelize) Empty result error';
        this.status = 404;
      }
      this.message = message;
    }
  }

  /**
   * Map Sequelize's `ValidationErrorItem` to Express-Validator's `ValidationError` type
   * @param errors Array of ValidationErrorItem (from Sequelize `BaseError` instance)
   * @returns Array of Express-Validator's `ValidationError` type
   */
  mapValidationErrors(
    errors: SequelizeValidationErrorItem[]
  ): ValidationErrorItem[] {
    return errors.map((item) => {
      const { message, type, path, value } = item;

      return {
        msg: `${type}: ${message}`,
        value,
        param: path ? camelize(path, true) : '',
        location: 'database',
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
