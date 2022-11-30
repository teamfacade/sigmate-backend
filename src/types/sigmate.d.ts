declare namespace sigmate {
  namespace Error {
    export type HandlerOptions<T = string> = {
      type?: T | 'OTHER';
      error?: unknown;
      message?: string;
    };
  }

  namespace Logger {
    type UUID = string;
    type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

    type Level =
      | 'error'
      | 'warn'
      | 'info'
      | 'http'
      | 'verbose'
      | 'debug'
      | 'silly';

    type AllStates = Readonly<{
      INITIALIZED: 0;
      STARTING: 1;
      STARTED: 2;
      FINISHED: 3;
      CLOSING: 4;
      CLOSED: 5;
      FAILED: 6;
    }>;

    type ActionTypes = Readonly<{
      SERVICE: 0;
      DATABASE: 1;
      HTTP: 2;
    }>;

    type ActionType = ActionTypes[keyof ActionTypes];

    type Status = AllStates[keyof AllStates];

    // type Source =
    //   | 'SERVER'
    //   | 'SERVICE'
    //   | 'REQUEST'
    //   | 'ACTION'
    //   | 'ACTION(HTTP)'
    //   | 'ACTION(DB)';

    // format
    // timestamp level message
    // message
    // SOURCE 'NAME' status: message (duration) id: info

    export interface Info {
      timestamp: Date;
      level: Level;
      message?: string;
      duration?: number;
      id?: {
        default: UUID;
        user?: number; // 0: Unauthenticated
        device?: number;
      };
      server?: {
        name: string;
        status: Status;
      };
      service?: {
        name: string;
        status: Status;
      };
      request?: {
        method: HttpMethod;
        endpoint: string;
        size: number; // bytes, size of body
        query?: Record<string, any>;
        params?: Record<string, any>;
        body?: Record<string, any>;
      };
      action?: {
        type: ActionType;
        name: string;
        status: Status;
        info?: Record<string, any>;
      };
      response?: {
        status: number; // HTTP Status code
        size: number; // bytes, size of payload
        body?: Record<string, any>;
      };
      error?: unknown; // log the stack
    }
  }
}
