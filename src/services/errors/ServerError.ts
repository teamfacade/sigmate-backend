/*
ERROR CODE PREFIXES
  - ER: ERROR
  - WR: WARNING
  - UA: UNAVAILABLE
  - NF: NOT FOUND
  - IV: INVALID
*/

export interface ServerErrorOptions<
  CodeType extends string = string,
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
   * A critical error.
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
const DEFAULT_ERROR_CODE = 'UNEXPECTED';
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

  constructor(options: ServerErrorOptions) {
    const { name, error: cause, logData } = options;
    const code = options.code || DEFAULT_ERROR_CODE;
    const message = options.message || DEFAULT_ERROR_MESSAGE;
    super(message);
    const defaults: sigmate.Error.ErrorDefaults =
      code in this.defaultsMap ? this.defaultsMap[code] : {};
    if (defaults.message) this.message = defaults.message;
    this.name = name || DEFAULT_ERROR_NAME;
    this.cause = cause;
    this.logData = logData;
    this.code = code;
    this.httpCode =
      options.httpCode || defaults.httpCode || DEFAULT_ERROR_HTTPCODE;
    this.logLevel =
      options.logLevel || defaults.logLevel || DEFAULT_ERROR_LOGLEVEL;
    this.notify = options.notify || defaults.notify || false;
    this.critical = options.critical || defaults.critical || false;
  }

  protected get defaultsMap(): sigmate.Error.ErrorDefaultsMap {
    return {};
  }

  protected loadDefaults(code: keyof typeof this.defaultsMap) {
    if (code in this.defaultsMap) {
      const { message, httpCode, logLevel, notify, critical } =
        this.defaultsMap[code];
      if (message !== undefined) this.message = message;
      if (httpCode !== undefined) this.httpCode = httpCode;
      if (logLevel !== undefined) this.logLevel = logLevel;
      if (notify !== undefined) this.notify = notify;
      if (critical !== undefined) this.critical = critical;
    }
  }
}
