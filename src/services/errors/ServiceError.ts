import ServerError, { ServerErrorOptions } from './ServerError';

export type ServiceErrorCode =
  | 'SERVICE/ALREADY_INIT'
  | 'SERVICE/NOT_INIT'
  | 'SERVICE/NO_CTOR'
  | 'SERVICE/UA'
  | 'SERVICE/WR_NODE_ENV'
  | 'SERVICE/OTHER'
  | 'DB/OTHER'
  | 'LOGGER/OTHER';

type ErrorDefaultsMap = sigmate.Error.ErrorDefaultsMap<ServiceErrorCode>;

export const defaultsMap: ErrorDefaultsMap = {
  'SERVICE/NOT_INIT': {
    message: 'Service is not instantiated. Call setInstance() first',
  },
  'SERVICE/ALREADY_INIT': {
    message: 'Service is already instantiated. Use getInstace() instead',
  },
  'SERVICE/NO_CTOR': {
    message:
      'Do not call the service constructor directly. Use getInstance() instead',
  },
  'SERVICE/UA': {
    message: 'Service is not available',
    httpCode: 503,
  },
  'SERVICE/WR_NODE_ENV': {
    logLevel: 'debug',
    message: 'NODE_ENV not set -- assuming "development"',
  },
  'DB/OTHER': {
    message: 'Unexpected error in DatabaseService',
  },
  'LOGGER/OTHER': {
    message: 'Unexpected error int LoggerService',
  },
  'SERVICE/OTHER': {},
};

export default class ServiceError extends ServerError {
  constructor(options: ServerErrorOptions<ServiceErrorCode>) {
    super({
      ...options,
      name: 'ServiceError',
    });
  }

  get defaultsMap() {
    return defaultsMap;
  }
}
