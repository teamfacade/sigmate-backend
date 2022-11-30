import { ServiceStatus } from '../utils/status';

export default abstract class Service {
  static STATE = ServiceStatus;
  static status: typeof ServiceStatus[keyof typeof ServiceStatus] =
    ServiceStatus.INITIALIZED;
  static get started() {
    return this.status >= ServiceStatus.STARTED;
  }
  static get closed() {
    return this.status >= ServiceStatus.CLOSING;
  }
  // static start()
  // static close()
  // abstract onError(options: sigmate.Error.HandlerOptions): void;
}
