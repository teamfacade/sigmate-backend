import winston, { format, Logger } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import WinstonDynamoDB from './transports/dynamo';
import ServerError from '../errors/ServerError';
import config from '../../../config';
import { waitTimeout } from '../../../utils/wait';
const { timestamp, combine, printf, colorize } = format;

type IssueLoggerOptions = {
  console?: boolean;
  cloudWatchLogs?: boolean;
};

type AnalyticsLoggerOptions = {
  dynamoDB?: boolean;
};

type DebugLoggerOptions = {
  console?: boolean;
};

export default class LoggerService {
  // ************ STATIC ************

  // For key shortening and expansion on DynamoDB
  static CLOUDWATCH_LOG_GROUP_PROD = 'sigmate-app';
  static CLOUDWATCH_LOG_STREAM_PROD = 'production-1';
  static CLOUDWATCH_LOG_GROUP_TEST = 'sigmate-app';
  static CLOUDWATCH_LOG_STREAM_TEST = 'production-1';
  static CLOUDWATCH_LOG_GROUP_DEV = 'sigmate-app-dev';
  static CLOUDWATCH_LOG_STREAM_DEV = 'dev-1';
  static DYNAMODB_TABLE_PROD = 'sigmate-app-log';
  static env = process.env.NODE_ENV;

  static EVENT_SERVER = 'SERVER_EVENT';
  static EVENT_SERVER_ERROR = 'SERVER_ERROR';

  static dynamoDB?: DynamoDB;
  static cloudWatchLogs?: CloudWatchLogs;

  static getDynamoUserAttribute = (
    userId: sigmate.Logger.LogInfo['userId'],
    deviceId: sigmate.Logger.LogInfo['deviceId']
  ) => `${deviceId}#${userId === undefined ? '-' : userId}`;

  static createDynamoLogEntry(
    info: sigmate.Logger.LogInfo
  ): sigmate.Logger.DynamoDBLogEntry {
    if (info.status && !info.status?.formatted) {
      info = LoggerService.formatStatus().transform(
        info
      ) as sigmate.Logger.LogInfo;
    }

    const reqDataExists =
      Boolean(info.request?.query) ||
      Boolean(info.request?.params) ||
      Boolean(info.request?.body);

    const actionType =
      info.action?.type === 'SERVICE'
        ? 'S'
        : info.action?.type === 'DATABASE'
        ? 'D'
        : undefined;

    const entry: sigmate.Logger.DynamoDBLogEntry = {
      user: LoggerService.getDynamoUserAttribute(info.deviceId, info.userId),
      timestamp: info.timestamp
        ? new Date(info.timestamp).getTime()
        : new Date().getTime(),
      id: info.request?.id || info.action?.id || undefined,
      level: info.level,
      message: info.message,
      status: info.status?.formatted,
      err: info.error?.stack,
      srvEvent: info.server?.event,
      srvErr: info.server?.error?.stack,
      reqId: info.request?.id,
      reqMtd: info.request?.method,
      reqEpt: info.request?.endpoint,
      reqData: reqDataExists
        ? {
            query: info.request?.query,
            params: info.request?.params,
            body: info.request?.body,
          }
        : undefined,
      reqSize: info.request?.size,
      reqErr: info.server?.error?.stack,
      resStatus: info.request?.response?.status,
      resBody: info.request?.response?.body,
      resTime: info.request?.response?.duration,
      actId: info.action?.id,
      actType: actionType,
      actName: info.action?.name,
      actTModel: info.action?.target?.model,
      actTId: info.action?.target?.pk,
      actSModel: info.action?.source?.model,
      actSId: info.action?.source?.pk,
      actData: info.action?.data,
      actPId: info.action?.parent,
      actErr: info.action?.error?.stack,
      trx: info.transaction,
      [Symbol.for('level')]: info.level,
    };

    return entry;
  }

  static statusMap: Record<
    sigmate.Logger.RequestStatus | sigmate.Logger.ActionStatus,
    string
  > = {
    STARTED: 'S',
    IN_PROGRESS: 'P',
    FINISHED: 'F',
    ERROR: 'E',
    DELAYED: 'D',
    UNDEFINED: '-',
  };

  // Formats
  static formatStatus = format((info) => {
    const { status } = info as sigmate.Logger.LogInfo;
    if (!status) return info;

    const {
      request = 'UNDEFINED',
      action = 'UNDEFINED',
      dAction = 'UNDEFINED',
    } = status;

    const rs =
      request in LoggerService.statusMap
        ? LoggerService.statusMap[request]
        : '-';
    const as =
      action in LoggerService.statusMap ? LoggerService.statusMap[action] : '-';
    const das =
      dAction in LoggerService.statusMap
        ? LoggerService.statusMap[dAction]
        : '-';

    info.status.formatted = `${rs}${as}${das}`;

    return info;
  });

  static formatMessage = format((info) => {
    info.level = info.level.toUpperCase();

    // Format status if it has not been done already
    if (!info.status?.formatted) {
      info = LoggerService.formatStatus().transform(
        info
      ) as winston.Logform.TransformableInfo;
    }

    const { message, status, request, action, server } =
      info as sigmate.Logger.LogInfo;

    let fMessage = '';
    fMessage += `${status?.formatted || '***'} `;

    let id = '';

    if (action) {
      id = action.id;
      fMessage += `(${action.name}) `;
    } else if (request) {
      id = request.id;
      fMessage += `(${request.method} ${request.endpoint}) `;
    } else if (server) {
      fMessage += `(${server.event}) `;
    }

    // Add the log message
    fMessage += message;

    // Add the Id of the request/action
    if (id) {
      fMessage += ` (${id})`;
    }

    // Append error stack trace if included
    if (action?.error?.stack) {
      fMessage += `\n${action.error.stack}`;
    }

    if (request?.error?.stack) {
      fMessage += `\n${request.error.stack}`;
    }

    if (server?.error?.stack) {
      fMessage += `\n${server.error.stack}`;
    }

    info.message = fMessage;
    return info;
  });

  static formatAnalytics = format((info) => {
    return LoggerService.createDynamoLogEntry(info as sigmate.Logger.LogInfo);
  });

  static colorizeLevels = colorize({
    level: true,
    message: false,
    colors: {
      error: 'bold red',
      warn: 'bold yellow',
      info: 'bold green',
      http: 'magenta',
      verbose: 'blue',
      debug: 'cyan',
      silly: 'gray',
    },
  });

  /**
   * Ignores all levels below the specified options
   */
  static ignoreBelow = format(
    (info, opts: { level: sigmate.Logger.LogLevel }) => {
      const levels = winston.config.npm.levels;
      if (levels[info.level] < levels[opts.level]) return false;
      return info;
    }
  );
  static printIssue = printf(({ level, message }) => `${level}: ${message}`);
  static printDebug = printf(
    ({ level, message, timestamp, ...rest }) =>
      `${timestamp} ${level}: ${message} ${JSON.stringify(rest)}`
  );

  // ************ INSTANCE ************

  /** Logs issues that need review (<info) */
  protected issueLogger?: Logger;
  /** Logs kept for analytics (<verbose) */
  protected analyticsLogger?: Logger;
  /** Logs for debugging purposes (<silly) */
  protected debugLogger?: Logger;
  /**
   * Set to `true` when the `close()` method is called.
   * Prevents the logging to an already closed logger.
   */
  public closed = false;

  constructor() {
    // Initialize AWS SDKs if not already done
    if (!LoggerService.dynamoDB) {
      LoggerService.dynamoDB = new DynamoDB(config.aws.dynamoDB.logger);
    }

    if (!LoggerService.cloudWatchLogs) {
      LoggerService.cloudWatchLogs = new CloudWatchLogs(
        config.aws.cloudWatchLogs.logger
      );
    }

    // Initialize loggers depending on environment
    const env = LoggerService.env;
    if (env === 'development') {
      // For development, log EVERYTHING to the console
      this.initDebugLogger({ console: true });
    } else if (env === 'production') {
      this.initAnalyticsLogger({ dynamoDB: true });
      // In production, log issues and analytics separately, and
      // discard debug information
      this.initIssueLogger({ console: true, cloudWatchLogs: true });
    }
  }

  protected initIssueLogger(options: IssueLoggerOptions = {}) {
    // Options specify which transport to enable
    const { console = true, cloudWatchLogs = false } = options;

    // A logger must have at least one transport
    if (!console && (!cloudWatchLogs || !LoggerService.cloudWatchLogs)) {
      throw new Error('No transport specified for issueLogger');
    }

    // Initialize logger
    const il = winston.createLogger({
      level: 'info',
      format: combine(
        LoggerService.formatStatus(),
        LoggerService.formatMessage(),
        LoggerService.printIssue
      ),
    });

    // Add transport for console
    if (console) {
      il.add(new winston.transports.Console());
    }

    // Add transport for AWS CloudWatch Logs
    if (cloudWatchLogs && LoggerService.cloudWatchLogs) {
      // Initialize a AWS CloudWatch Logs client (only once per server)
      il.add(
        new WinstonCloudWatch({
          cloudWatchLogs: LoggerService.cloudWatchLogs,
          logGroupName: LoggerService.CLOUDWATCH_LOG_GROUP_DEV,
          logStreamName: LoggerService.CLOUDWATCH_LOG_STREAM_DEV,
        })
      );
    }

    // Assign logger to instance variable
    this.issueLogger = il;
  }

  protected initAnalyticsLogger(options: AnalyticsLoggerOptions = {}) {
    // Options specify which transport to enable
    const { dynamoDB = true } = options;

    // A logger must have at least one transport
    if (!dynamoDB || !LoggerService.dynamoDB) {
      throw new Error('No transport specified for analyticsLogger');
    }

    // Initialize logger
    const al = winston.createLogger({
      level: 'verbose',
      format: combine(timestamp(), LoggerService.formatAnalytics()),
    });

    if (dynamoDB && LoggerService.dynamoDB) {
      // Add transport for AWS DynamoDB
      al.add(
        new WinstonDynamoDB({
          tableName: LoggerService.DYNAMODB_TABLE_PROD,
          dynamoDBInstance: LoggerService.dynamoDB,
        })
      );
    }

    // Assign logger to instance variable
    this.analyticsLogger = al;
  }

  protected initDebugLogger(options: DebugLoggerOptions = {}) {
    // Options specify which transport to enable
    const { console = true } = options;

    // A logger must have at least one transport
    if (!console) {
      throw new Error('No transport specified for debugLogger');
    }

    // Initialize logger
    const dl = winston.createLogger({
      level: 'silly',
      format: combine(
        timestamp({ format: 'MMM DD HH:mm:ss' }), // Apr 04 16:44:44
        LoggerService.formatMessage()
      ),
    });

    // Add transport for console
    if (console) {
      dl.add(
        new winston.transports.Console({
          format: combine(
            LoggerService.colorizeLevels,
            LoggerService.printDebug
          ),
        })
      );
    }

    // Assign logger to instance variable
    this.debugLogger = dl;
  }

  protected log(info: sigmate.Logger.LogInfo) {
    // Don't attempt to log if the logger is already closed
    if (this.closed) return;

    const il = this.issueLogger;
    const al = this.analyticsLogger;
    const dl = this.debugLogger;

    il && il.log({ ...info });
    al && al.log({ ...info });
    dl && dl.log({ ...info });
  }

  /**
   * Log misc server activity information
   * @param message Message to leave in log entry
   * @param info Additional log information
   */
  public logServerEvent(
    message: sigmate.Logger.LogInfo['message'],
    info: Omit<sigmate.Logger.LogInfo, 'message'> = { level: 'info' }
  ) {
    const { level = 'info', server } = info;
    this.log({
      level,
      message,
      userId: 0,
      deviceId: 0,
      status: info.status || {
        action: 'STARTED',
      },
      server: {
        event: LoggerService.EVENT_SERVER,
        ...server,
      },
    });
  }

  /**
   * Create a log entry for a thrown ServerError, or a error message (string).
   * A ServerError is treated as 'unexpected' when the origin property is set
   * and the logLevel property is either `'error'`, `'warn'` or `undefined`.
   *
   * For expected errors, just log the `${error.name}: ${error.message}` by
   * pre-filling the message property of the info object and not including the
   * original error object.
   *
   * For unexpected errors, keep the `message` property of the `info` object empty
   * (will be filled by formatters later),
   * and populate the `server.error` property with the `ServerError` instance, and
   * the `error` property with the `Error` object stored in `ServerError.origin`.
   *
   * @param error String describing the error or a ServerError instance
   * @param info Additional log information
   */
  public logServerError(
    error: string | ServerError,
    info: sigmate.Logger.LogInfoParam = {}
  ) {
    let level = info.level || 'error';
    let message = '';
    let serverError: ServerError | undefined = undefined;
    let originError: Error | undefined = undefined;

    if (typeof error === 'string') {
      // If the provided error is a string, just log that
      message = error;
    } else {
      // If the provided error is a ServerError instance,
      if (error.unexpected) {
        // Unexpected errors log at ERROR level
        level = info.level || 'error';
        serverError = error;
        originError = error.origin as Error;
      } else {
        level = info.level || 'warn';
        message = `${error.name}: ${error.message}`;
      }
    }

    this.log({
      level,
      message,
      server: {
        event: LoggerService.EVENT_SERVER_ERROR,
        error: serverError,
      },
      error: originError,
    });
  }

  /**
   * Requests the given Logger instance to close gracefully
   * @param logger Logger to close
   * @param timeout Maximum time to wait for logger to close gracefully
   * @returns Promise that resolves on Logger close or timeout
   */
  private async closeLogger(
    logger: winston.Logger | undefined,
    timeout = 3000
  ) {
    // If the logger is not defined, skip
    if (!logger) return;

    // Wait for the logger to finish.
    // If it doesn't finish within the given threshold, time out.
    const loggerFinish = new Promise<void>((resolve) => {
      logger.on('finish', () => resolve());
    });
    await waitTimeout(loggerFinish, timeout);

    try {
      logger.end();
    } catch (error) {
      console.error(error);
    }

    try {
      logger.close();
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Wait for a given Logger to close (wait for 'close' to be emitted)
   * @param logger Logger to wait for close
   * @param timeout Maximum time to wait for Logger to close gracefully
   * @returns Promise that resolves on Logger close or timeout
   */
  private waitLoggerClose(logger: winston.Logger | undefined) {
    if (!logger) return;

    return new Promise<void>((resolve) => {
      logger.on('close', () => resolve());
    });
  }

  /**
   * Wait for all loggers to finish logging and gracefully close all Loggers
   */
  public async close() {
    this.closed = true;

    await Promise.all([
      this.closeLogger(this.issueLogger),
      this.closeLogger(this.analyticsLogger),
      this.closeLogger(this.debugLogger),
    ]);

    await Promise.all([
      this.waitLoggerClose(this.issueLogger),
      this.waitLoggerClose(this.analyticsLogger),
      this.waitLoggerClose(this.debugLogger),
    ]);
  }
}
