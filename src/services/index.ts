import { ServiceStatus } from './status';

export default abstract class Service {
  static STATUS = ServiceStatus;
  static status: typeof ServiceStatus[keyof typeof ServiceStatus] =
    ServiceStatus.INITIALIZED;
  static get started() {
    return this.status >= ServiceStatus.STARTED;
  }
  static get closed() {
    return this.status >= ServiceStatus.CLOSED;
  }
  // static start()
  abstract onError(options: sigmate.Error.HandlerOptions): void;
}
