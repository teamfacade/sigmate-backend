import { ErrorCodeMap } from '.';
import ServerError, { ServerErrorOptions } from './ServerError';

export interface ServiceErrorOptions
  extends Omit<ServerErrorOptions, 'name' | 'label'> {
  name?: ServerErrorOptions['name'];
  serviceName?: NonNullable<ServerErrorOptions['label']>['name'];
}

export type ServiceErrorHelperOptions = Omit<
  ServiceErrorOptions,
  'name' | 'serviceName'
>;

type ServiceErrorCode =
  | 'SERVICE/INIT_BEFORE_START'
  | 'SERVICE/INIT_AFTER_FAIL'
  | 'SERVICE/NA_CLOSED'
  | 'SERVICE/NA_FAILED'
  | 'SERVICE/ER_CLOSE';

export const ERROR_CODES_SERVICE: ErrorCodeMap<ServiceErrorCode> = {
  'SERVICE/INIT_BEFORE_START': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Service initialized before being started',
  },
  'SERVICE/INIT_AFTER_FAIL': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Service initialized after failure',
  },
  'SERVICE/NA_CLOSED': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Service is not available (closed)',
  },
  'SERVICE/NA_FAILED': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Service is not available (failed)',
  },
  'SERVICE/ER_CLOSE': {
    status: 500,
    level: 'warn',
    critical: false,
    message: 'Error encountered during service close',
  },
};

export default class ServiceError extends ServerError {
  constructor(options: ServiceErrorOptions) {
    const { name, serviceName = 'SERVICE', ...rest } = options;
    super({
      name: name || 'ServiceError',
      label: {
        source: 'SERVICE',
        name: serviceName,
      },
      ...rest,
    });
  }
}
