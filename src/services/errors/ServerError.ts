/*
ERROR CODE PREFIXES
  - ER: ERROR
  - WR: WARNING
  - UA: UNAVAILABLE
  - NF: NOT FOUND
  - IV: INVALID
  - IL: ILLEGAL
  - CF: CONFLICT
*/

import { AllErrorCode, ERROR_DEFAULTS_MAP } from '.';

export interface ServerErrorOptions<
  CodeType extends string = AllErrorCode,
  LogDataType = any
> {
  /** Human-friendly error message */
  message?: string;
  /** Unique error code. (All caps) */
  code?: CodeType;
  /** Error name for categorization */
  name?: string;
  /** Original error object that caused this error */
  error?: unknown;
  /** HTTP status code to use in response. Defaults to 500 */
  httpCode?: number;
  /** Logging level */
  logLevel?: sigmate.Logger.Level;
  /** Additional data to keep in log */
  logData?: LogDataType;
  /** Notify developers when encountering this error */
  notify?: boolean;
  /**
   * A critical error. Does NOT affect logging levels
   * Servers and services should close if an uncaught critical error occurs.
   * By default, tests stop retrying when a critical error occurs.
   */
  critical?: boolean;
}

export type ErrorOptions<
  CodeType extends string = string,
  LogDataType = any
> = Omit<ServerErrorOptions<CodeType, LogDataType>, 'defaultsMap'>;

// Fallback values to use when defaults are not specified
const DEFAULT_ERROR_MESSAGE = 'Unexpected server error';
const DEFAULT_ERROR_NAME = 'ServerError';
const DEFAULT_ERROR_CODE = 'SERVER/OTHER';
const DEFAULT_ERROR_HTTPCODE = 500;
const DEFAULT_ERROR_LOGLEVEL = 'error';

export default class ServerError<LogDataType = any> extends Error {
  cause?: unknown;
  code: string;
  httpCode: number;
  logLevel: sigmate.Logger.Level;
  logData?: LogDataType;
  notify: boolean;
  critical: boolean;

  constructor(options: ServerErrorOptions<AllErrorCode, LogDataType>) {
    const { name, error: cause, logData } = options;

    // Load defaults from code
    const code = options.code || DEFAULT_ERROR_CODE;
    const defaults: sigmate.Error.ErrorDefaults =
      code in ERROR_DEFAULTS_MAP ? ERROR_DEFAULTS_MAP[code] : {};

    // Assemble message
    let message = defaults.message || '';
    message += defaults.message ? '. ' : '';
    message += options.message || '';
    message ||= DEFAULT_ERROR_MESSAGE;
    super(message);

    // From constructor options
    this.name = name || DEFAULT_ERROR_NAME;
    this.cause = cause;
    this.logData = logData;
    this.code = code;

    // From defaults and constructor options
    this.httpCode =
      options.httpCode || defaults.httpCode || DEFAULT_ERROR_HTTPCODE;
    this.logLevel =
      options.logLevel || defaults.logLevel || DEFAULT_ERROR_LOGLEVEL;
    this.notify = options.notify || defaults.notify || false;
    this.critical = options.critical || defaults.critical || false;
  }
}
