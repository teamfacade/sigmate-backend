declare namespace sigmate.Logger {
  type LogLevel =
    | 'error'
    | 'warn'
    | 'info'
    | 'http'
    | 'verbose'
    | 'debug'
    | 'silly';

  type ActionType = 'SERVICE' | 'DATABASE' | 'HTTP';
  type ActionStatus = 'NOT STARTED' | 'STARTED' | 'FINISHED' | 'ERROR';
  type RequestStatus = ActionStatus | 'DELAYED';
  // type TransactionStatus = 'STARTED' | 'IN_PROGRESS' | 'COMMIT' | 'ROLLBACK';

  export type LogInfo = {
    timestamp?: Date;
    level: LogLevel;
    message: string;
    duration?: number;
    /** Id of the User model. 0: System, -1: Unauthorized */
    userId?: number;
    /** Id of the UserDevice model. 0: System */
    deviceId?: number;
    status?: {
      request?: RequestStatus;
      action?: ActionStatus;
      dAction?: ActionStatus;
      /** Contains three letter string formatted for logging */
      formatted?: string;
    };
    error?: unknown;
    server?: {
      id: string;
      event: string;
      error?: ServerError;
    };
    request?: {
      id: string;
      method?: string;
      endpoint?: string;
      query?: Record<string, any>;
      params?: Record<string, any>;
      body?: Record<string, any>;
      /** Size of the HTTP request payload */
      size?: number;
      response?: {
        status: number;
        body?: any;
        duration?: number;
        /** Size of the HTTP response payload */
        size?: number;
      };
      error?: Error; // TODO change to RequestError
    };
    action?: {
      type: ActionType;
      id: string;
      name: string;
      target?: {
        model: string;
        pk: string; // pk.toString()
      };
      source?: {
        model: string;
        pk: string;
      };
      data?: any;
      parent?: string;
      error?: Error; // TODO change to ActionError
    };
    transaction?: string;
  };

  export type LogInfoParam = sigmate.Util.Optional<
    Omit<LogInfo, 'message'>,
    'level'
  >;

  /**
   * Log entry to be stored in DynamoDB.
   * Keep attribute key names as short as possible to reduce read/write cost.
   */
  export type DynamoDBLogEntry = {
    /**
     * User identifier (PARTITION KEY) //
     * Format:   `${deviceId}#${userId}` //
     * userId:   0: SYSTEM, -1: UNAUTHORIZED //
     * deviceId: 0: SYSTEM //
     */
    user: string;
    /** Time when this log entry was creatd. (SORT KEY) */
    timestamp: number;
    /**
     * Id of the request or the action that created this log entry
     * Used as global secondary index in DynamoDB table.
     */
    id?: string;
    /** Log level */
    level: string;
    /** Log message */
    message: string;
    /** Status of the request, action, and database action */
    status?: string; // formatted
    /**
     * Error: Error stack trace of unexpected (original) error
     * If a ServerError, RequestError, or an ActionError was thrown from
     * an unexpected cause, the original error stack trace will be logged here
     */
    err?: string;

    /**
     * serverEvent: Name of the event that occured in the server level
     */
    srvEvent?: string;
    /**
     * serverError: Error stack trace of a ServerError instance
     * Only included in the log if the error was thrown from an unexpected cause
     */
    srvErr?: string;

    // Request
    /**
     * requestId: Id of the request that created this log entry.
     * Format: uuid (v4)
     */
    reqId?: string;
    /** requestMethod: HTTP request method */
    reqMtd?: string;
    /** requestEndpoint: HTTP request endpoint */
    reqEpt?: string;
    /** requestData: Data included in the request */
    reqData?: {
      query?: Record<string, any>;
      params?: Record<string, any>;
      body?: Record<string, any>;
    };
    /** requestSize: Size of the HTTP request payload */
    reqSize?: number;

    /**
     * requesetError: Error stack trace of a RequestError instance
     * Only included in the log if the error was thrown from an unexpected cause
     */
    reqErr?: string;
    /** responseStatus: HTTP response status code sent to the client */
    resStatus?: number;
    /** responseBody: Response body sent to the client */
    resBody?: Record<string, any>;
    /** responseTime: Time it took for the server to process the request */
    resTime?: number;
    /** responseSize: Size of the HTTP response payload */
    resSize?: number;
    // Action
    /**
     * actionId: Id of the action that created this log entry. //
     * Format: uuid (v4)
     */
    actId?: string;
    /**
     * actionType: A service or database level action. //
     * Possible values:
     *  s: Service action,
     *  d: Database action
     */
    actType?: string;
    /** actionName */
    actName?: string;
    /** actionTargetModel: Action target object model name */
    actTModel?: string;
    /** actionTargetId: Action target object primary key */
    actTId?: string;
    /** actionSourceModel: Action source object model name */
    actSModel?: string;
    /** actionSourceId: Action source object primary key */
    actSId?: string;
    /** actionData: Data given to, or produced by the action */
    actData?: Record<string, any>;
    /** actionParentId: The action that created this (sub)action (i.e. parent) */
    actPId?: string;
    /**
     * actionError: Error stack trace of an ActionError instance
     * Only included in the log if the error was thrown from an unexpected cause
     */
    actErr?: string;

    /** transaction: Name of the current SQL DB transaction (if any) */
    trx?: string;
  };
}
