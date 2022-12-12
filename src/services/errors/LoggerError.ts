import { ErrorCodeMap } from '.';
import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

type LoggerErrorCode =
  | 'LOGGER/ER_INIT_AWS_CLOUDWATCH'
  | 'LOGGER/ER_INIT_AWS_DYNAMO'
  | 'LOGGER/ER_INIT_NO_TRANSPORT';

export const ERROR_CODES_LOGGER: ErrorCodeMap<LoggerErrorCode> = {
  // SERVICE 'LOGGER'
  'LOGGER/ER_INIT_AWS_CLOUDWATCH': {
    status: 503,
    level: 'error',
    critical: false,
    message: 'AWS CloudWatchLogs client initialization failed',
  },
  'LOGGER/ER_INIT_AWS_DYNAMO': {
    status: 503,
    level: 'error',
    critical: false,
    message: 'AWS DynamoDB client initialization failed',
  },
  'LOGGER/ER_INIT_NO_TRANSPORT': {
    status: 500,
    level: 'error',
    critical: true, // Fail server
    message: 'No transport specified',
  },
};

export default class LoggerError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'LoggerError',
      serviceName: 'LOGGER',
      ...options,
    });
  }
}
