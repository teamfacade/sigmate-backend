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
    export type HandlerOptions<T = string> = {
      code?: T;
      error?: unknown;
      message?: string;
    };

    export type ErrorName =
      | 'ServerError'
      | 'ServiceError'
      | 'RequestError'
      | 'ActionError'
      | 'DatabaseError'
      | 'LoggerError'
      | 'AuthError'
      | 'GoogleAuthError'
      | 'MetamaskAuthError'
      | 'UserError'
      | 'TokenError';

    export type ErrorSource =
      | 'SERVER'
      | 'SERVICE'
      | 'REQUEST'
      | 'ACTION'
      | 'UNKNOWN';
    export type AppErrorCode = 'APP/ER_ENV' | 'APP/ER_START';
    export type MiscErrorCode = 'UNKNOWN/ER_UNHANDLED';
    export type ServiceErrorCode =
      | 'SERVICE/INIT_BEFORE_START'
      | 'SERVICE/INIT_AFTER_FAIL'
      | 'SERVICE/NA_CLOSED'
      | 'SERVICE/NA_FAILED'
      | 'SERVICE/ER_CLOSE';

    export type ActionErrorCode =
      | 'ACTION/ER_TX_START'
      | 'ACTION/ER_TX_COMMIT'
      | 'ACTION/ER_TX_ROLLBACK'
      | 'ACTION/CF_SET_TARGET'
      | 'ACTION/CF_SET_SOURCE'
      | 'ACTION/ER_RUN_FAILED'
      | 'ACTION/RJ_UNAUTHORIZED'
      | 'ACTION/NA_PARENT_ENDED'
      | 'ACTION/NA_ENDED';

    export type DatabaseErrorCode =
      | 'DB/ER_CONN'
      | 'DB/ER_ADD_MODELS'
      | 'DB/ER_TEST_ATTEMPT'
      | 'DB/ER_TEST'
      | 'DB/ER_RUN'
      | 'DB/ER_TX_START'
      | 'DB/ER_TX_COMMIT'
      | 'DB/ER_TX_ROLLBACK'
      | 'DB/ER_CLOSE'
      | 'DB/NA_CLOSED'
      | 'DB/NA_FAILED';

    export type GoogleErrorCode =
      | 'GOOGLE/NA_AUTH_URL'
      | 'GOOGLE/ER_TOKEN'
      | 'GOOGLE/IV_DTO'
      | 'GOOGLE/IV_TOKEN'
      | 'GOOGLE/IV_PROFILE';

    export type LoggerErrorCode =
      | 'LOGGER/ER_INIT_AWS_CLOUDWATCH'
      | 'LOGGER/ER_INIT_AWS_DYNAMO'
      | 'LOGGER/ER_INIT_NO_TRANSPORT';

    export type MetamaskErrorCode =
      | 'METAMASK/ER_NONCE_GEN'
      | 'METAMASK/IV_DTO'
      | 'METAMASK/ER_VERIFY'
      | 'METAMASK/IV_SIGNATURE';

    export type AuthErrorCode =
      | 'AUTH/NF'
      | 'AUTH/IV_UPDATE_DTO'
      | 'AUTH/NA_USER_GROUP'
      | 'AUTH/NA_GROUP_PRIV'
      | 'AUTH/RJ_GROUP_UNAUTHORIZED'
      | 'AUTH/RJ_USER_UNAUTHORIZED';

    export type TokenErrorCode =
      | 'TOKEN/NA_KEY_FILE'
      | 'TOKEN/ER_KEY_READ'
      | 'TOKEN/NA_KEY'
      | 'TOKEN/NA_USER'
      | 'TOKEN/NF_USER'
      | 'TOKEN/NF_USER_AUTH'
      | 'TOKEN/IV_VERIFY_PAYLOAD'
      | 'TOKEN/ER_VERIFY_TYPE'
      | 'TOKEN/ER_VERIFY_IAT'
      | 'TOKEN/IV_TYPE';

    export type UserErrorCode =
      | 'USER/NF'
      | 'USER/NF_AUTH'
      | 'USER/IV_CREATE_DTO'
      | 'USER/IV_UPDATE_AUTH_DTO'
      | 'USER/RJ_UNAME_TAKEN'
      | 'USER/NF_REF_CODE'
      | 'USER/RJ_REF_CODE_SET';

    export type ErrorLabel = {
      source: ErrorSource;
      name: string;
    };

    export type ErrorDefaults = {
      status?: number;
      level?: sigmate.Logger.Level;
      critical?: boolean;
      message?: string;
    };

    export type ErrorCodeMap<T extends string> = Record<T, ErrorDefaults>;
  }

  namespace Logger {
    type UUID = string;
    type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

    type Level =
      | 'error'
      | 'warn' // default for all errors
      | 'info' // default for all other logs
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

    // format
    // timestamp level message
    // message
    // SOURCE 'NAME' status: message (duration) id: info

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
        status: Status;
      };
      service?: {
        name: string;
        status: Status;
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
        status: Status;
        target?: {
          model: string;
          id: string;
        };
        source?: {
          model: string;
          id: string;
        };
        data?: Record<string, unknown>;
        depth: number;
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
