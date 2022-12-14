import { ValidationError as ExpressValidationErrorItem } from 'express-validator';
import {
  ERROR_CODES_UNKNOWN,
  ERROR_CODES_APP,
  ERROR_CODES_SERVICE,
  ERROR_CODES_ACTION,
  ERROR_CODES_DB,
  ERROR_CODES_LOGGER,
  ERROR_CODES_TOKEN,
  ERROR_CODES_USER,
  ERROR_CODES_AUTH,
  ERROR_CODES_GOOGLE,
  ERROR_CODES_METAMASK,
} from './codes';

export type ErrorCode = keyof typeof ERROR_CODES;
export const ERROR_CODES = Object.freeze({
  ...ERROR_CODES_UNKNOWN,
  ...ERROR_CODES_APP,
  ...ERROR_CODES_SERVICE,
  ...ERROR_CODES_ACTION,
  ...ERROR_CODES_DB,
  ...ERROR_CODES_LOGGER,
  ...ERROR_CODES_TOKEN,
  ...ERROR_CODES_USER,
  ...ERROR_CODES_AUTH,
  ...ERROR_CODES_GOOGLE,
  ...ERROR_CODES_METAMASK,
});

export interface ServerErrorOptions {
  name: sigmate.Error.ErrorName;
  code?: ErrorCode;
  error?: unknown;
  label: sigmate.Error.ErrorLabel;
  message?: string;
  level?: sigmate.Logger.Level;
  critical?: boolean;
  httpStatus?: number;
}

export type ValidationErrorItem = Omit<
  ExpressValidationErrorItem,
  'location'
> & {
  location: ExpressValidationErrorItem['location'] | 'database';
};

export type ServerErrorResponse = {
  success: false;
  error: {
    code: string;
    msg: string;
  };
};

export default class ServerError extends Error {
  /**
   * Name of the error that describes the general class of errors
   */
  name: string;
  /**
   * Error code that determines the default message, log levels,
   * critical flag, and http status code.
   * Also used by frontend code for error handling
   */
  code: ErrorCode;
  cause?: unknown;
  label: sigmate.Error.ErrorLabel;
  // message: string;
  level: sigmate.Logger.Level;
  critical: boolean;
  httpStatus: number;
  validationErrors?: ValidationErrorItem[] = undefined;
  fields?: string[] = undefined;

  constructor(options: ServerErrorOptions) {
    const {
      name,
      label,
      code = 'UNKNOWN/ER_UNHANDLED',
      error: cause,
    } = options;

    const {
      message,
      level,
      critical,
      status: httpStatus,
    } = ServerError.getErrorDefaults(options);

    super(message);
    this.name = name || 'ServerError';
    this.label = label;
    this.code = code;
    this.cause = cause;
    this.level = level;
    this.critical = critical;
    this.httpStatus = httpStatus;
  }

  static getErrorDefaults(
    options: Partial<ServerErrorOptions>
  ): Required<sigmate.Error.ErrorDefaults> {
    const { code = 'UNKNOWN/ER_UNHANDLED' } = options;
    let { message = '', level, critical, httpStatus: status } = options;

    const defaults = ERROR_CODES[code];
    if (defaults.message) {
      message = message ? `${defaults.message}. ${message}` : defaults.message;
    }
    if (defaults.level) {
      level = level || defaults.level;
    }
    if (defaults.critical !== undefined) {
      critical = critical === undefined ? defaults.critical : critical;
    }
    if (defaults.status) {
      status = status || defaults.status;
    }

    if (!level) level = 'error';
    if (critical === undefined) critical = true;
    if (!status) status = 500;

    return {
      message,
      level,
      critical,
      status,
    };
  }
}
