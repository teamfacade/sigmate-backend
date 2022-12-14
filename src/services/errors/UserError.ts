import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

export default class UserError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'UserError',
      serviceName: 'USER',
      ...options,
    });
  }
}
