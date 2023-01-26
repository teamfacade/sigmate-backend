import LoggerService from './logger/LoggerService';

export type ServiceStatus = keyof typeof Service['STATUS'];
type ServiceHook = (prev: ServiceStatus, cause?: unknown) => void;

export interface ServiceOptions {
  name: string;
}
/**
 * Base class for services. Use as singleton.
 */
export default class Service {
  /** Service lifecycle states */
  public static STATUS = Object.freeze({
    /** Constructor called */
    INITIALIZED: 0,
    /** Start method called but not finished */
    STARTING: 1,
    /** Start method finished */
    STARTED: 2,
    /** Service is available for use */
    AVAILABLE: 3,
    /**
     * Service is unavailable, but in a non-critical state.
     * It may be self-recovering, or in a state where recovery can be attempted
     */
    UNAVAILABLE: 4,
    /** Close method called, but not finished. Service is unavailble */
    CLOSING: 5,
    /** Close method finished */
    CLOSED: 6,
    /**
     * Service is unavailable, and in a critical state.
     * All self-recovery steps have failed (if any), or
     * in a state where attempting to recover is meaningless.
     */
    FAILED: 7,
  });

  /** Logger instance for status change logging (dependency injected from `LoggerService` constructor) */
  protected static logger: LoggerService;

  /** Service status (lifecycle) */
  protected __status: ServiceStatus = 'INITIALIZED';
  /** Service status (lifecycle) */
  public get status() {
    return this.__status;
  }

  /** Name of the service (for logging) */
  public name: string;

  constructor(options: ServiceOptions) {
    this.name = options.name;
  }

  public isAvailable(): boolean {
    return this.status === 'AVAILABLE';
  }
  public started(): boolean {
    return Service.STATUS[this.status] >= Service.STATUS.STARTED;
  }
  public closed(): boolean {
    return Service.STATUS[this.status] >= Service.STATUS.CLOSING;
  }
  public failed() {
    return this.status === 'FAILED';
  }

  /** Changes the internal status variable and logs the change */
  public setStatus(value: ServiceStatus, cause?: unknown) {
    if (this.__status === value) return;
    const prev = this.__status;
    this.__status = value;
    this.onStatusChange(prev, cause);
    switch (value) {
      case 'STARTING':
        this.onStart && this.onStart(prev, cause);
        break;
      case 'AVAILABLE':
        this.onAvailable && this.onAvailable(prev, cause);
        break;
      case 'UNAVAILABLE':
        this.onUnavailable && this.onUnavailable(prev, cause);
        break;
      case 'CLOSING':
        this.onClose && this.onClose(prev, cause);
        break;
      case 'CLOSED':
        this.onClosed && this.onClosed(prev, cause);
        break;
      case 'FAILED':
        this.onFail && this.onFail(prev, cause);
        break;
    }
  }

  /** Async preparations for this service */
  public async start() {
    this.setStatus('STARTED');
  }

  /** Test to check service availability */
  public async test(): Promise<void> {
    this.setStatus('AVAILABLE');
  }

  /** Async chores to complete for graceful shutdown */
  public async close() {
    this.setStatus('CLOSED');
  }

  // Hooks
  protected onStatusChange(prev: ServiceStatus, cause?: unknown) {
    Service.logger?.log({
      service: this,
      error: cause || undefined,
      printStatus: true,
    });
  }
  protected onStart?: ServiceHook;
  protected onAvailable?: ServiceHook;
  protected onUnavailable?: ServiceHook;
  protected onClose?: ServiceHook;
  protected onClosed?: ServiceHook;
  protected onFail?: ServiceHook;
}
