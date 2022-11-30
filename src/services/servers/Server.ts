import { ServerStatus } from '../../utils/status';

export default abstract class Server {
  static STATUS = ServerStatus;
  /** Ensure that only one instance of Server exists in process */
  static initialized = false;

  status: typeof ServerStatus[keyof typeof ServerStatus] =
    ServerStatus.INITIALIZED;
  get started() {
    return this.status >= ServerStatus.STARTED;
  }
  get closed() {
    return this.status >= ServerStatus.CLOSED;
  }
  env = process.env.PORT;

  abstract start(): Promise<void>;
  abstract close(): Promise<void>;
  /** Callback to run when the server has been started successfully */
  abstract onStart(): void;
  /** Callback to run when a critical error has occured */
  abstract onError(options: sigmate.Error.HandlerOptions): void;
  /** Event handler for SIGINT event on this process */
  abstract onSigint(): void;
}
