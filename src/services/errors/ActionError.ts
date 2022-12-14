import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

export default class ActionError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'ActionError',
      serviceName: 'ACTION',
      ...options,
    });
  }
}
