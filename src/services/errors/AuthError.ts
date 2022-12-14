import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

export class AuthError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'AuthError',
      serviceName: 'AUTH',
      ...options,
    });
  }
}
