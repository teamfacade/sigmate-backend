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
    type Status =
      | 'INITIALIZED'
      | 'STARTING'
      | 'STARTED'
      | 'CLOSING'
      | 'CLOSED'
      | 'FAILED';
  }

  namespace Service {
    type Status =
      | 'INITIALIZED'
      | 'STARTING'
      | 'STARTED'
      | 'AVAILABLE'
      | 'UNAVAILABLE'
      | 'CLOSING'
      | 'CLOSED'
      | 'FAILED';
  }

  namespace Action {
    type Type = 'SERVICE' | 'DATABASE' | 'HTTP';
    type Status =
      | 'INITIALIZED'
      | 'STARTING'
      | 'STARTED'
      | 'FINISHING'
      | 'FINISHED'
      | 'FAILED';
  }

  namespace Logger {
    type UUID = string;
    type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
    type Level = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';

    export interface Info {
      timestamp?: string;
      level: Level;
      message: string;
      duration?: number;
      id?: UUID;
      user?: string; // -1: Unauthenticated, 0: system
      device?: UAParser.IResult; // 0: system
      location?: string; // 0: System, IP address
      error?: unknown; // log the stack
      logOptions?: {
        printStatus?: boolean;
        notify?: boolean;
      };
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
        size: number; // bytes, size of request body
        query?: Record<string, unknown>;
        params?: Record<string, unknown>;
        body?: Record<string, unknown>;
        response?: {
          status: number; // HTTP status code
          size: number; // bytes, size of response payload
          body?: unknown;
        };
        data?: Record<string, unknown>;
      };
      action?: {
        type: Action.Type;
        name: string;
        status: Action.Status;
        target?: {
          model: string;
          id: string;
        };
        source?: {
          model: string;
          id: string;
        };
        metric?: Record<string, number>;
      };
    }

    type AnalyticsInfoType =
      | 'server'
      | 'service'
      | 'request'
      | 'action'
      | 'error'
      | 'other';

    export interface AnalyticsInfo {
      timestamp?: number;
      level: string;
      message: string;
      type: AnalyticsInfoType;
      name: string;
      duration?: number; // milliseconds
      id?: UUID;
      user?: string;
      device?: UAParser.IResult;
      location?: string; // IP address
      size?: {
        // bytes
        request?: number;
        response?: number;
      };
      metric?: Record<string, number>;
      target?: {
        model: string;
        id: string;
      };
      source?: {
        model: string;
        id: string;
      };
      error?: {
        code?: string;
        name: string;
        message: string;
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
       * User identifier (PARTITION KEY)
       */
      user: number;

      device: number;

      location: number;
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
