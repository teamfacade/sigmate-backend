import { v4 as uuidv4 } from 'uuid';
import LoggerService, { logger } from '../services/logger/LoggerService';

export type ServerStatus = keyof typeof BaseServer['STATUS'];

type ServerHook = (prev: ServerStatus, cause?: unknown) => void;

export default abstract class BaseServer {
  public static STATUS = Object.freeze({
    INITIALIZED: 0,
    STARTING: 1,
    STARTED: 2,
    CLOSING: 5,
    CLOSED: 6,
    FAILED: 7,
  });

  id: sigmate.Logger.UUID;
  name: string;
  __status: ServerStatus = 'INITIALIZED';
  get status() {
    return this.__status;
  }

  constructor(name: string) {
    this.id = uuidv4();
    this.name = name;
  }

  protected setStatus(value: ServerStatus, cause?: unknown) {
    const prev = this.__status;
    this.__status = value;
    if (prev === value) return;
    this.onStatusChange(prev, cause);
    switch (value) {
      case 'STARTING':
        this.onStart && this.onStart(prev, cause);
        break;
      case 'STARTED':
        this.onStarted && this.onStarted(prev, cause);
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

  public abstract start(): Promise<void>;
  public abstract close(): Promise<void>;

  // Hooks
  protected onStatusChange(prev: ServerStatus, cause?: unknown) {
    logger.log({
      server: this,
      error: cause || undefined,
      printStatus: true,
    });
  }
  protected onStart?: ServerHook;
  protected onStarted?: ServerHook;
  protected onClose?: ServerHook;
  protected onClosed?: ServerHook;
  protected onFail?: ServerHook;
}
