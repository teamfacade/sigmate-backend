import ServerError from '../errors';
import { logger } from './logger';

export default class Service {
  name: string;
  status: sigmate.ServiceStatus;
  public get env() {
    return process.env.NODE_ENV || 'development';
  }
  public get isAvailable() {
    return this.status === 'AVAILABLE';
  }

  constructor(name: string) {
    this.name = name;
    this.status = 'INITIALIZED';
  }

  protected setStatus(
    status: sigmate.ServiceStatus,
    error: unknown = undefined
  ) {
    if (status === this.status) return;
    this.status = status;
    logger.log({
      level: error ? 'error' : 'debug',
      source: 'Service',
      event: 'SERVICE/STATUS_CHANGE',
      name: this.name,
      status: this.status,
      error,
    });
  }

  start(): void | Promise<void> {
    this.status = 'AVAILABLE';
  }

  close(): void | Promise<void> {
    this.status = 'CLOSED';
  }

  logMessage(message: string, level: sigmate.Log.Level = 'info') {
    logger.log({
      level,
      message,
      source: 'Service',
      event: 'SERVICE/MESSAGE',
      name: this.name,
    });
  }

  logError(error: unknown, message = '', level?: sigmate.Log.Level) {
    logger.log({
      level: level || (error instanceof ServerError ? error.logLevel : 'error'),
      message,
      source: 'Service',
      event: 'SERVICE/ERROR',
      name: this.name,
      error,
    });
  }
}
