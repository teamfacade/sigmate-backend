declare namespace sigmate {
  namespace Request {
    /**
     * DTO to use to set the pagination attribute in the Request instance
     */
    export type PaginationDTO = {
      limit?: number;
      page?: number;
      offset?: number;
      count?: number;
    };

    /**
     * Expected pagination request from client, parsed from HTTP request query
     */
    export type PaginationReq = {
      limit: number;
      page?: number;
      offset?: number;
    };

    /**
     * Pagination data to send back in response to client
     */
    export type PaginationRes = {
      limit: number;
      offset: number;
      page: {
        current: number;
        total: number;
      };
      count: number;
    };
  }

  namespace Error {
    type ErrorDefaults = Partial<{
      message: string;
      httpCode: number;
      logLevel: sigmate.Logger.Level;
      notify: boolean;
      critical: boolean;
    }>;

    type ErrorDefaultsMap<CodeType = string> = Record<CodeType, ErrorDefaults>;
  }

  namespace Server {
    type States = ReadOnly<{
      INITIALIZED: 0;
      STARTING: 1;
      STARTED: 2;
      CLOSING: 5;
      CLOSED: 6;
      FAILED: 7;
    }>;

    type Status = keyof States;
  }

  namespace Service {
    type States = ReadOnly<{
      INITIALIZED: 0;
      STARTING: 1;
      STARTED: 2;
      AVAILABLE: 3;
      UNAVAILABLE: 4;
      CLOSING: 5;
      CLOSED: 6;
      FAILED: 7;
    }>;

    type Status = keyof States;
  }

  namespace Logger {
    type UUID = string;
    type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
    type Level = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';
    type ActionType = 'SERVICE' | 'DATABASE' | 'HTTP';

    export interface Info {
      timestamp?: string;
      level: Level;
      message: string;
      duration?: number;
      id?: {
        default: UUID;
        user?: number; // -1: Unauthenticated, 0: system
        device?: number; // 0: system
      };
      error?: unknown; // log the stack
      server?: {
        name: string;
        status: sigmate.Server.Status;
      };
      service?: {
        name: string;
        status: sigmate.Service.Status;
      };
      request?: {
        method: string;
        endpoint: string;
        size: number; // bytes, size of body
        query?: Record<string, unknown>;
        params?: Record<string, unknown>;
        body?: Record<string, unknown>;
        response?: {
          status: number; // HTTP Status code
          size: number; // bytes, size of payload
          body?: unknown;
        };
      };
      action?: {
        type: ActionType;
        name: string;
        status: sigmate.Service.State;
        target?: {
          model: string;
          id: string;
        };
        source?: {
          model: string;
          id: string;
        };
        data?: Record<string, unknown>;
      };
    }

    export interface DynamoInfo {
      // COMMON
      /** Time when this log entry was created. (SORT KEY) */
      timestamp: number;
      level: string;
      message: string;
      duration?: number;
      /**
       * id.default
       * Id of the request or the action that created this log entry
       * Used as global secondary index in DynamoDB table.
       */
      id?: string;
      /**
       * User identifier (PARTITION KEY) //
       * Format:   `u${id.user}d${id.device}` //
       * userId:   0: SYSTEM, -1: UNAUTHENTICATED //
       * deviceId: 0: SYSTEM //
       */
      user: string;
      /**
       * Error information formatted as:
       * `error.name: error.message`
       * For ServerError instances, include the error.cause as well
       * `error.name: error.message (error.cause.name: error.cause.message)`
       */
      err?: string;

      // SERVER
      /** server.name */
      serverName?: string;
      /** server.status */
      serverStatus?: string;

      // SERVICE
      /** service.name */
      serviceName?: string;
      /** service.status */
      serviceStatus?: string;

      // REQUEST
      /** request.method: HTTP request method */
      reqMtd?: string;
      /** request.endpoint: HTTP request endpoint */
      reqEpt?: string;
      /** request.query/params/body: Data included in the request */
      reqData?: {
        query?: Record<string, any>;
        params?: Record<string, any>;
        body?: Record<string, any>;
      };
      /** request.size: Size of the HTTP request payload */
      reqSize?: number;
      /** response.status: HTTP response status code sent to the client */
      resStatus?: number;
      /** response.body: Response body sent to the client */
      resBody?: unknown;
      /** response.size: Size of the HTTP response payload */
      resSize?: number;

      // ACTION
      /** action.type */
      actType?: string;
      /** action.name */
      actName?: string;
      /** action.status */
      actStatus?: string;
      /** action.target.model: Action target object model name */
      actTModel?: string;
      /** action.target.id: Action target object primary key */
      actTId?: string;
      /** action.source.model: Action source object model name */
      actSModel?: string;
      /** action.source.id: Action source object primary key */
      actSId?: string;
      /** action.data: Data given to, or produced by the action */
      actData?: Record<string, any>;
    }
  }
}
