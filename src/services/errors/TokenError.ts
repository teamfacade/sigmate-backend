import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

export default class TokenError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'TokenError',
      serviceName: 'TOKEN',
      ...options,
    });
  }
}
