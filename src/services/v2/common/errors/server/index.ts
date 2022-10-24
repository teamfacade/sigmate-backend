import { SigmateLogLevel } from '../../logger';

export interface ServerErrorOptions {
  level?: SigmateLogLevel;
  origin?: Error;
  message?: string;
}

export default class ServerError extends Error {
  // Logging level
  level: SigmateLogLevel;

  // The original Error that was thrown
  origin?: Error;

  constructor(options: ServerErrorOptions = {}) {
    const { level, message, origin } = options;

    super(message || 'ServerError');
    this.level = level || 'error';
    this.origin = origin;
  }
}
