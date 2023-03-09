import { v4 as uuidv4 } from 'uuid';
import { DateTime, Settings } from 'luxon';
import { logger } from '../services/logger';

export default class SigmateServer {
  id: string;
  name: string;
  status: sigmate.ServiceStatus;
  startedAt: luxon.DateTime;
  public get env() {
    return process.env.NODE_ENV || 'development';
  }

  constructor(name: string) {
    this.id = uuidv4();
    this.name = name;
    this.status = 'INITIALIZED';
    this.startedAt = DateTime.now();
    Settings.defaultZone = 'utc';
  }

  protected setStatus(
    status: sigmate.ServiceStatus,
    error: unknown = undefined
  ) {
    if (this.status === status) return;
    this.status = status;
    logger.log({
      level: error ? 'error' : 'info',
      source: 'Server',
      event: 'SERVER/STATUS_CHANGE',
      name: this.name,
      status: this.status,
      error,
    });
  }
}
