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
  static get failed() {
    return this.status === ServiceStatus.FAILED;
  }
  abstract name: string;
  abstract get serviceStatus(): typeof Service.status;
  // static start()
  // static close()
  // abstract onError(options: sigmate.Error.HandlerOptions): void;
}
