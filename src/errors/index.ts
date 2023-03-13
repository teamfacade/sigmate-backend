import { ValidationError } from 'express-validator';

export default class ServerError<
  ErrorCode extends string = string
> extends Error {
  code: ErrorCode | 'ER/OTHER';
  logLevel: sigmate.Error.Data['logLevel'];
  httpCode: sigmate.Error.Data['httpCode'];
  cause: sigmate.Error.Data['error'];
  notify: sigmate.Error.Data['notify'];
  critical: sigmate.Error.Data['critical'];
  secure: sigmate.Error.Data['secure'];
  validationErrors?: ValidationError[];

  constructor(options: sigmate.Error.RootOptions<ErrorCode>) {
    if (typeof options === 'string') options = { code: options };
    const { code, defaultsMap, error: cause, validationErrors } = options;
    let { message, name, logLevel, httpCode, notify, critical, secure } =
      options;

    if (code && defaultsMap && code in defaultsMap) {
      const defaults = defaultsMap[code];
      // message ||= defaults.message;
      if (defaults.message && message) {
        message = `${defaults.message}. ${message}`;
      } else {
        message ||= defaults.message;
      }
      logLevel ||= defaults.logLevel;
      httpCode ||= defaults.httpCode;
      notify ||= defaults.notify;
      critical ||= defaults.critical;
      secure ||= defaults.secure;
    }
    message ||= 'Unexpected server error';
    name ||= 'ServerError';
    logLevel ||= 'error';
    httpCode ||= 500;
    notify ||= false;
    critical ||= false;
    secure ||= false;

    super(message);
    this.code = code || 'ER/OTHER';
    this.name = name;
    this.logLevel = logLevel;
    this.httpCode = httpCode;
    this.cause = cause;
    this.notify = notify;
    this.critical = critical;
    this.secure = secure;
    this.validationErrors = validationErrors;
  }

  static parseOptions<ErrorCode extends string = string>(
    name: string,
    options: sigmate.Error.Options<ErrorCode>,
    defaultsMap: sigmate.Error.DefaultsMap<ErrorCode>
  ): sigmate.Error.RootOptions<ErrorCode> {
    if (typeof options === 'string') {
      options = {
        code: options,
      };
    }
    return { ...options, name, defaultsMap };
  }
}
