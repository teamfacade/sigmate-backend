import { ServerErrorOptions } from './ServerError';
import ServiceError, {
  defaultsMap as serviceDefaultsMap,
  ServiceErrorCode,
} from './ServiceError';

export type LoggerErrorCode =
  | 'LOGGER/AWS/ER_CLOUDWATCH'
  | 'LOGGER/AWS/ER_DYNAMO'
  | ServiceErrorCode;

type ErrorDefaultsMap = sigmate.Error.ErrorDefaultsMap<LoggerErrorCode>;

const defaultsMap: ErrorDefaultsMap = {
  'LOGGER/AWS/ER_CLOUDWATCH': {},
  'LOGGER/AWS/ER_DYNAMO': {},
  ...serviceDefaultsMap,
};

export default class LoggerError extends ServiceError {
  constructor(options: ServerErrorOptions<LoggerErrorCode>) {
    super({
      ...options,
      code: 'LOGGER/OTHER',
      name: 'LoggerError',
    });
    if (options.code) this.loadDefaults(options.code);
  }

  get defaultsMap() {
    return defaultsMap;
  }
}
