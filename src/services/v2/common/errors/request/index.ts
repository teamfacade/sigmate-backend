import ServerError, { ServerErrorOptions } from '../server';

export interface RequestErrorOptions extends ServerErrorOptions {
  status?: number;
  clientMessage?: string;
}

export default class RequestError extends ServerError {
  // Error response
  status = 500;
  clientMessage?: string;

  constructor(options: RequestErrorOptions = {}) {
    const { status, clientMessage, level, origin, message } = options;

    super({ level, origin, message });
    if (status) this.status = status;
    if (clientMessage) this.clientMessage = clientMessage;
  }
}
