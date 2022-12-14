import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

export default class LoggerError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'LoggerError',
      serviceName: 'LOGGER',
      ...options,
    });
  }
}
