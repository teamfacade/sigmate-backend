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
  ValidationErrorItem as SequelizeValidationErrorItem,
} from 'sequelize';
import { camelize } from 'inflection';
import ServiceError, { ServiceErrorOptions } from './ServiceError';
import { ValidationErrorItem } from './ServerError';
import { ErrorCode, ErrorCodeMap, ErrorDefaults } from '.';

interface DatabaseErrorOptions
  extends Omit<ServiceErrorOptions, 'name' | 'label'> {
  code?: ErrorCode;
}

export type DatabaseErrorCode =
  | 'DB/ER_CONN'
  | 'DB/ER_ADD_MODELS'
  | 'DB/ER_TEST_ATTEMPT'
  | 'DB/ER_TEST'
  | 'DB/ER_RUN'
  | 'DB/ER_TX_START'
  | 'DB/ER_TX_COMMIT'
  | 'DB/ER_TX_ROLLBACK'
  | 'DB/ER_CLOSE'
  | 'DB/NA_CLOSED'
  | 'DB/NA_FAILED';

export const ERROR_CODES_DB: ErrorCodeMap<DatabaseErrorCode> = {
  // SERVICE 'DB'
  'DB/ER_CONN': {
    status: 503,
    level: 'error',
    message: 'DB connection failed',
  },
  'DB/ER_ADD_MODELS': {
    status: 500,
    level: 'error',
    message: 'Failed to import and add models',
  },
  'DB/ER_TEST_ATTEMPT': {
    status: 500,
    level: 'warn',
    message: 'Test attempt failed',
  },
  'DB/ER_TEST': {
    status: 503,
    level: 'error',
    message: 'Final test attempt failed. DB is not available',
  },
  'DB/ER_RUN': {
    level: 'debug',
    message: 'DB run failed',
  },
  'DB/ER_TX_START': {
    status: 500,
    level: 'warn',
    message: 'DB transaction start failed',
  },
  'DB/ER_TX_COMMIT': {
    status: 500,
    level: 'warn',
    message: 'DB transaction commit failed',
  },
  'DB/ER_TX_ROLLBACK': {
    status: 500,
    level: 'warn',
    message: 'DB transaction rollback failed',
  },
  'DB/ER_CLOSE': {
    status: 500,
    level: 'warn',
    critical: false,
    message: 'DB connection close failed',
  },
  'DB/NA_CLOSED': {
    status: 503,
    level: 'debug',
    message: 'DB service unavailable (closed)',
  },
  'DB/NA_FAILED': {
    status: 503,
    level: 'debug',
    message: 'DB service unavailable (failed)',
  },
};

type SequelizeErrorCode =
  | 'AccessDenied'
  | 'InvalidConnection'
  | 'ConnectionTimedOut'
  | 'Connection'
  | 'UniqueConstraint'
  | 'Validation'
  | 'ForeignKeyConstraint'
  | 'Timeout'
  | 'EmptyResult'
  | 'Other'
  | 'NotBaseError';

const ERROR_CODES_SEQUELIZE: ErrorCodeMap<SequelizeErrorCode> = {
  AccessDenied: {
    level: 'error',
    status: 403,
    critical: true,
    message: '(Sequelize: Database connection access denied)',
  },
  InvalidConnection: {
    level: 'error',
    status: 500,
    critical: true,
    message: '(Sequelize: Database connection invalid)',
  },
  ConnectionTimedOut: {
    level: 'warn',
    status: 500,
    critical: false,
    message: '(Sequelize: Database connection timed out)',
  },
  // Connection failed due to other reasons:
  // ConnectionAcquireTimeOut, ConnectionRefused, HostNotFound, HostNotReachable
  Connection: {
    level: 'warn',
    status: 503,
    critical: true,
    message: '(Sequelize: Database connection failed)',
  },
  UniqueConstraint: {
    level: 'debug',
    status: 409,
    critical: false,
    message: '(Sequelize: SQL Unique constraint violation)',
  },
  Validation: {
    level: 'debug',
    status: 400,
    critical: false,
    message: '(Sequelize: Invalid value)',
  },
  ForeignKeyConstraint: {
    level: 'debug',
    status: 409,
    critical: false,
    message: '(Sequelize: SQL Foreign key constraint violation)',
  },
  Timeout: {
    level: 'warn',
    status: 408,
    critical: false,
    message: '(Sequelize: Database timed out)',
  },
  EmptyResult: {
    level: 'debug',
    status: 404,
    critical: false,
    message: '(Sequelize: Query result empty)',
  },
  Other: {
    level: 'warn',
    status: 500,
    critical: false,
    message: '(Sequelize: An error occurred)',
  },
  // Error not caused by Sequelize
  NotBaseError: {},
};

export default class DatabaseError extends ServiceError {
  sequelizeErrorCode: SequelizeErrorCode;

  constructor(options: DatabaseErrorOptions) {
    const { error: cause } = options;
    const { code: sequelizeErrorCode, ...defaults } =
      DatabaseError.getSequelizeErrorDefaults(cause);

    if (options.message) {
      defaults.message += ` ${options.message}`;
    }

    super({
      ...options,
      name: 'DatabaseError',
      serviceName: 'DATABASE',
      ...defaults,
    });
    this.sequelizeErrorCode = sequelizeErrorCode;
    switch (sequelizeErrorCode) {
      case 'UniqueConstraint':
      case 'Validation':
        this.validationErrors = this.databaseValidationErrors;
        break;
      case 'ForeignKeyConstraint':
        this.fields = this.camelizedDatabaseFields;
        break;
    }
  }

  static getSequelizeErrorDefaults(
    cause: unknown
  ): ErrorDefaults & { code: SequelizeErrorCode } {
    let code: SequelizeErrorCode = 'NotBaseError';
    if (cause instanceof BaseError) {
      if (cause instanceof AccessDeniedError) {
        code = 'AccessDenied';
      } else if (cause instanceof InvalidConnectionError) {
        code = 'InvalidConnection';
      } else if (cause instanceof ConnectionTimedOutError) {
        code = 'ConnectionTimedOut';
      } else if (cause instanceof ConnectionError) {
        code = 'Connection';
      } else if (cause instanceof UniqueConstraintError) {
        code = 'UniqueConstraint';
      } else if (cause instanceof ValidationError) {
        code = 'Validation';
      } else if (cause instanceof ForeignKeyConstraintError) {
        code = 'ForeignKeyConstraint';
      } else if (cause instanceof TimeoutError) {
        code = 'Timeout';
      } else if (cause instanceof EmptyResultError) {
        code = 'EmptyResult';
      } else {
        code = 'Other';
      }
    }
    return {
      code,
      ...ERROR_CODES_SEQUELIZE[code],
    };
  }

  /**
   * Map Sequelize's `ValidationErrorItem` to Express-Validator's `ValidationError` type
   * @returns Array of Express-Validator's `ValidationError` type
   */
  get databaseValidationErrors(): ValidationErrorItem[] {
    if (
      this.cause instanceof UniqueConstraintError ||
      this.cause instanceof ValidationError
    ) {
      if (!this.cause.errors) {
        return [];
      }
      return this.cause.errors.map(
        (item: SequelizeValidationErrorItem): ValidationErrorItem => {
          const { message, type, path, value } = item;

          return {
            msg: `${type}: ${message}`,
            value,
            param: path ? camelize(path, true) : '',
            location: 'database',
          };
        }
      );
    }
    return [];
  }

  get camelizedDatabaseFields() {
    if (
      this.cause instanceof ForeignKeyConstraintError ||
      this.cause instanceof UniqueConstraintError
    ) {
      const fields: string[] | { [k: string]: unknown } | undefined =
        this.cause.fields;
      if (!fields) {
        return [];
      }
      if (fields instanceof Array) {
        return fields.map((f) => camelize(f, true));
      } else {
        return Object.keys(fields).map((f) => camelize(f, true));
      }
    }
    return [];
  }
}
