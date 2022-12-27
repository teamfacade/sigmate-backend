import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

export class MissionError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'MissionError',
      serviceName: 'MISSION',
      ...options,
    });
  }
}
