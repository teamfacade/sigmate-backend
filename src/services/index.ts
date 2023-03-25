import ServerError from '../errors';
import ServiceError from '../errors/service';
import { logger } from './logger';

export default class Service {
  protected static uninterruptibleTasks: Set<Promise<unknown>> = new Set();

  public static Uninterruptible() {
    return (target: any, key: string, desc?: PropertyDescriptor) => {
      const tasks = target.constructor.uninterruptibleTasks;
      const method = desc?.value || target[key];
      const uiWrapper = async function (...args: any[]) {
        let result: any;
        try {
          // Typing of this requires disabling TS checks
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          result = method.apply(this, args);
          if (result instanceof Promise) tasks.add(result);
          return await result;
        } finally {
          if (result) tasks.delete(result);
        }
      };
      desc?.value ? (desc.value = uiWrapper) : (target[key] = uiWrapper);
    };
  }

  private static async waitTasks() {
    if (!this.uninterruptibleTasks) return;
    await Promise.all(Array.from(this.uninterruptibleTasks));
  }

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
    options: { error?: unknown; message?: string } = {}
  ) {
    const { error, message } = options;
    if (status === this.status) return;
    this.status = status;
    logger.log({
      level: error ? 'error' : 'debug',
      message,
      source: 'Service',
      event: 'SERVICE/STATUS_CHANGE',
      name: this.name,
      status: this.status,
      error,
    });
  }

  protected async waitTasks() {
    const service = this.constructor as typeof Service;
    await service.waitTasks();
  }

  start(): void | Promise<void> {
    this.status = 'AVAILABLE';
  }

  close(): void | Promise<void> {
    this.status = 'CLOSED';
  }

  checkAvailable() {
    if (this.status === 'AVAILABLE') return;
    throw new ServiceError('SERVICE/UA');
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
