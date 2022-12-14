import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

export default class MetamaskAuthError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'MetamaskAuthError',
      serviceName: 'AUTH_METAMASK',
      ...options,
    });
  }
}
