import winston, { format, Logger as WinstonLogger } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import WinstonDynamoDB from './transports/dynamo';
import ServerError from '../errors/ServerError';
import config from '../../../config';
import { waitTimeout } from '../../../utils/wait';
import AppServer from '../servers/AppServer';
import BaseService from '../base/BaseService';
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

export default class Logger extends BaseService {
  // ************ STATIC ************

  // For key shortening and expansion on DynamoDB
  static CLOUDWATCH_LOG_GROUP_PROD = 'sigmate-app';
  static CLOUDWATCH_LOG_STREAM_PROD = 'production-1';
  static CLOUDWATCH_LOG_GROUP_TEST = 'sigmate-app';
  static CLOUDWATCH_LOG_STREAM_TEST = 'production-1';
  static CLOUDWATCH_LOG_GROUP_DEV = 'sigmate-app-dev';
  static CLOUDWATCH_LOG_STREAM_DEV = 'dev-1';
  static DYNAMODB_TABLE_PROD = 'sigmate-app-log';
  static EVENT_SERVER = 'SERVER_EVENT';
  static EVENT_SERVER_ERROR = 'SERVER_ERROR';

  // AWS SDKs
  static dynamoDB?: DynamoDB;
  static cloudWatchLogs?: CloudWatchLogs;

  // Loggers
  /** Logs issues that need review (<info) */
  protected static issueLogger?: WinstonLogger = undefined;
  /** Logs kept for analytics (<verbose) */
  protected static analyticsLogger?: WinstonLogger = undefined;
  /** Logs for debugging purposes (<silly) */
  protected static debugLogger?: WinstonLogger = undefined;

  static getDynamoUserAttribute = (
    userId: sigmate.Logger.LogInfo['userId'],
    deviceId: sigmate.Logger.LogInfo['deviceId']
  ) => `${deviceId}#${userId === undefined ? '-' : userId}`;

  static createDynamoLogEntry(
    info: sigmate.Logger.LogInfo
  ): sigmate.Logger.DynamoDBLogEntry {
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
      user: Logger.getDynamoUserAttribute(info.deviceId, info.userId),
      timestamp: info.timestamp
        ? new Date(info.timestamp).getTime()
        : new Date().getTime(),
      id: info.request?.id || info.action?.id || undefined,
      level: info.level,
      message: info.message,
      status: info.status?.formatted,
      err: info.error instanceof Error ? info.error.stack : undefined,
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

  static formatMessage = format((info) => {
    info.level = info.level.toUpperCase();

    const { message, request, action, server, error } =
      info as sigmate.Logger.LogInfo;

    let fMessage = '';

    let id = '';

    if (action) {
      id = action.id;
      fMessage += `${action.name}: `;
    } else if (request) {
      id = request.id;
      fMessage += `${request.method} ${request.endpoint}: `;
    } else if (server) {
      id = server.id;
      // fMessage += `${server.event}: `;
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

    if (error instanceof Error) {
      fMessage += `\n${error.name}: ${error.message}\n${error.stack}`;
    } else if (error) {
      fMessage += `${error}`;
    }

    info.message = fMessage;
    return info;
  });

  static formatAnalytics = format((info) => {
    return Logger.createDynamoLogEntry(info as sigmate.Logger.LogInfo);
  });

  static colorizeLog = colorize({
    level: true,
    message: true,
    colors: {
      error: 'red',
      warn: 'yellow',
      info: 'green',
      http: 'magenta',
      verbose: 'blue',
      debug: 'white',
      silly: 'dim white',
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
    ({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`
  );

  static started = false;

  static start() {
    // Initialize AWS SDKs if not already done
    if (!this.dynamoDB) {
      this.dynamoDB = new DynamoDB(config.aws.dynamoDB.logger);
    }

    if (!this.cloudWatchLogs) {
      this.cloudWatchLogs = new CloudWatchLogs(
        config.aws.cloudWatchLogs.logger
      );
    }

    this.started = true;
  }

  // ************ INSTANCE ************

  /** Logs issues that need review (<info) */
  protected issueLogger?: WinstonLogger;
  /** Logs kept for analytics (<verbose) */
  protected analyticsLogger?: WinstonLogger;
  /** Logs for debugging purposes (<silly) */
  protected debugLogger?: WinstonLogger;
  /**
   * Set to `true` when the `close()` method is called.
   * Prevents the logging to an already closed logger.
   */
  public closed = false;

  constructor() {
    if (!Logger.started) {
      throw new Error('LoggerService initialized before start');
    }
    super();
    // Initialize loggers depending on environment
    const env = process.env.NODE_ENV;
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
    if (Logger.issueLogger) {
      this.issueLogger = Logger.issueLogger;
      return;
    }

    // Options specify which transport to enable
    const { console = true, cloudWatchLogs = false } = options;

    // A logger must have at least one transport
    if (!console && (!cloudWatchLogs || !Logger.cloudWatchLogs)) {
      throw new Error('No transport specified for issueLogger');
    }

    // Initialize logger
    const il = winston.createLogger({
      level: 'info',
      format: combine(Logger.formatMessage(), Logger.printIssue),
    });

    // Add transport for console
    if (console) {
      il.add(
        new winston.transports.Console({
          format: combine(Logger.printDebug),
        })
      );
    }

    // Add transport for AWS CloudWatch Logs
    if (cloudWatchLogs && Logger.cloudWatchLogs) {
      // Initialize a AWS CloudWatch Logs client (only once per server)
      il.add(
        new WinstonCloudWatch({
          cloudWatchLogs: Logger.cloudWatchLogs,
          logGroupName: Logger.CLOUDWATCH_LOG_GROUP_DEV,
          logStreamName: Logger.CLOUDWATCH_LOG_STREAM_DEV,
        })
      );
    }

    // Assign logger to instance variable
    this.issueLogger = il;
  }

  protected initAnalyticsLogger(options: AnalyticsLoggerOptions = {}) {
    if (Logger.analyticsLogger) {
      this.analyticsLogger = Logger.analyticsLogger;
      return;
    }

    // Options specify which transport to enable
    const { dynamoDB = true } = options;

    // A logger must have at least one transport
    if (!dynamoDB || !Logger.dynamoDB) {
      throw new Error('No transport specified for analyticsLogger');
    }

    // Initialize logger
    const al = winston.createLogger({
      level: 'verbose',
      format: combine(timestamp(), Logger.formatAnalytics()),
    });

    if (dynamoDB && Logger.dynamoDB) {
      // Add transport for AWS DynamoDB
      al.add(
        new WinstonDynamoDB({
          tableName: Logger.DYNAMODB_TABLE_PROD,
          dynamoDBInstance: Logger.dynamoDB,
        })
      );
    }

    // Assign logger to instance variable
    this.analyticsLogger = al;
  }

  protected initDebugLogger(options: DebugLoggerOptions = {}) {
    if (Logger.debugLogger) {
      this.debugLogger = Logger.debugLogger;
      return;
    }

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
        timestamp({ format: 'HH:mm:ss.SSS' }), // 16:44:44.123
        Logger.formatMessage()
      ),
    });

    // Add transport for console
    if (console) {
      dl.add(
        new winston.transports.Console({
          format: combine(Logger.colorizeLog, Logger.printDebug),
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
    server: AppServer,
    info: Omit<sigmate.Logger.LogInfo, 'message'> = { level: 'info' }
  ) {
    const { level = 'info' } = info;

    this.log({
      level,
      message,
      userId: 0,
      deviceId: 0,
      status: info.status,
      server: {
        id: server.id,
        event: Logger.EVENT_SERVER,
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
    server: AppServer,
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
        id: server.id,
        event: Logger.EVENT_SERVER_ERROR,
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
