import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

export default class RequestError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'RequestError',
      serviceName: 'REQUEST',
      ...options,
    });
  }
}
