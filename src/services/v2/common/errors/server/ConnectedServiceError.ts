import ServerError, { ServerErrorOptions } from '.';

type ConnectedServiceName = 'RDS' | 'ElastiCache';

interface ConnectedServiceErrorOptions extends ServerErrorOptions {
  service: ConnectedServiceName;
}

export default class ConnectedServiceError extends ServerError {
  service: ConnectedServiceName;

  constructor(options: ConnectedServiceErrorOptions) {
    const { service, level, origin, message } = options;
    super({
      level: level || 'error',
      origin,
      message,
    });
    this.service = service;
  }
}
