import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

export class GoogleAuthError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'GoogleAuthError',
      serviceName: 'AUTH_GOOGLE',
      ...options,
    });
  }
}
