import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import winston, { format, Logger as WinstonLogger } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
const { combine, timestamp, printf, colorize } = format;
import Service from '../Service';
import config from '../../config';
import ServerError from '../errors/ServerError';
import { createDynamoInfo, formatMessage, padLevels } from './utils';
import { waitTimeout } from '../../utils';
import WinstonDynamoDB from './transports/dynamo';

type ErrorTypes = 'INIT' | 'NOT_STARTED' | 'LOGGER_CLOSE';

export default class Logger extends Service {
  static AWS_CONFIG = Object.freeze({
    development: {
      CLOUDWATCH: {
        LOG_GROUP: 'sigmate-app-dev',
        LOG_STREAM: 'dev-1',
      },
      DYNAMODB: {
        TABLE: 'sigmate-app-log',
      },
    },
    test: {
      CLOUDWATCH: {
        LOG_GROUP: 'sigmate-app',
        LOG_STREAM: 'production-1',
      },
      DYNAMODB: {
        TABLE: 'sigmate-app-log',
      },
    },
    production: {
      CLOUDWATCH: {
        LOG_GROUP: 'sigmate-app',
        LOG_STREAM: 'production-1',
      },
      DYNAMODB: {
        TABLE: 'sigmate-app-log',
      },
    },
  });
  private static env = process.env.NODE_ENV || 'development';
  private static dynamoDB: DynamoDB = undefined as unknown as DynamoDB;
  private static cloudWatchLogs: CloudWatchLogs =
    undefined as unknown as CloudWatchLogs;
  private static issueLogger: WinstonLogger =
    undefined as unknown as WinstonLogger;
  private static analyticsLogger: WinstonLogger =
    undefined as unknown as WinstonLogger;
  private static debugLogger: WinstonLogger =
    undefined as unknown as WinstonLogger;

  private static printableLog = printf((info) => {
    const { timestamp, level } = info;
    const message = formatMessage(info as sigmate.Logger.Info);
    return `${timestamp} ${padLevels(level, 7)} ${message}`;
  });

  private static dynamoLog = format((info) => {
    return createDynamoInfo(info as sigmate.Logger.Info);
  });

  private static colorizeLog = colorize({
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

  private static initIssueLogger(options: {
    console: boolean;
    cloudWatchLogs: boolean;
  }) {
    const { console, cloudWatchLogs } = options;
    // A logger must have at least one transport
    if (!console && !cloudWatchLogs) {
      this.onError({
        message: 'No transport specified for issueLogger',
      });
    }
    const il = winston.createLogger({
      level: 'info',
      format: combine(timestamp(), this.printableLog),
    });

    // Add transport (console)
    if (console) {
      il.add(
        new winston.transports.Console({
          format: this.colorizeLog,
        })
      );
    }

    // Add transport (AWS CloudWatch Logs)
    if (cloudWatchLogs) {
      if (!this.cloudWatchLogs) return this.onError({ type: 'NOT_STARTED' });
      il.add(
        new WinstonCloudWatch({
          cloudWatchLogs: this.cloudWatchLogs,
          logGroupName: this.AWS_CONFIG[this.env].CLOUDWATCH.LOG_GROUP,
          logStreamName: this.AWS_CONFIG[this.env].CLOUDWATCH.LOG_STREAM,
        })
      );
    }

    this.issueLogger = il;
  }

  private static initAnalyticsLogger(options: {
    console: boolean;
    dynamoDB: boolean;
  }) {
    const { console, dynamoDB } = options;
    // A logger must have at least one transport
    if (!console && !dynamoDB) {
      this.onError({ message: 'No transport specified for analyticsLogger' });
    }

    const al = winston.createLogger({
      level: 'verbose',
      format: combine(timestamp(), Logger.dynamoLog()),
    });

    // Add transport (console)
    if (console) {
      al.add(
        new winston.transports.Console({
          format: combine(
            this.colorizeLog,
            printf((info) => JSON.stringify(info))
          ),
        })
      );
    }

    // Add transport (AWS Dynamo DB)
    if (dynamoDB) {
      al.add(
        new WinstonDynamoDB({
          dynamoDB: Logger.dynamoDB,
          tableName: Logger.AWS_CONFIG[Logger.env].DYNAMODB.TABLE,
        })
      );
    }

    this.analyticsLogger = al;
  }

  private static initDebugLogger(options: { console: boolean }) {
    const { console } = options;
    // A logger must have at least one transport
    if (!console) {
      this.onError({ message: 'No transport specified for debugLogger' });
    }

    const dl = winston.createLogger({
      level: 'debug',
      format: combine(timestamp({ format: 'HH:mm:ss' }), Logger.printableLog),
    });

    if (console) {
      dl.add(
        new winston.transports.Console({
          format: Logger.colorizeLog,
        })
      );
    }

    this.debugLogger = dl;
  }

  public static start() {
    this.status = Logger.STATE.STARTING;
    // TODO Log service starting
    const aws = config.aws;
    this.dynamoDB = new DynamoDB(aws.dynamoDB.logger);
    this.cloudWatchLogs = new CloudWatchLogs(aws.cloudWatchLogs.logger);
    switch (this.env) {
      case 'development':
        this.initDebugLogger({ console: true });
        break;
      case 'test':
        this.initDebugLogger({ console: true });
        this.initIssueLogger({ console: false, cloudWatchLogs: true });
        break;
      case 'production':
        this.initIssueLogger({ console: true, cloudWatchLogs: true });
        this.initAnalyticsLogger({ console: false, dynamoDB: true });
        break;
    }
    this.status = Logger.STATE.STARTED;
    // TODO Log service started
  }

  /**
   * Requests the given Logger instance to close gracefully
   * @param logger Logger to close
   * @param timeout Maximum time to wait for logger to close gracefully
   * @returns Promise that resolves on Logger close or timeout
   */
  private static async closeLogger(
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
      this.onError({ type: 'LOGGER_CLOSE' });
    }

    try {
      logger.close();
    } catch (error) {
      this.onError({ type: 'LOGGER_CLOSE' });
    }
  }

  /**
   * Wait for a given Logger to close (wait for 'close' to be emitted)
   * @param logger Logger to wait for close
   * @param timeout Maximum time to wait for Logger to close gracefully
   * @returns Promise that resolves on Logger close or timeout
   */
  private static waitLoggerClose(logger: winston.Logger | undefined) {
    if (!logger) return;

    return new Promise<void>((resolve) => {
      logger.on('close', () => resolve());
    });
  }

  /**
   * Wait for all loggers to finish logging and gracefully close all Loggers
   */
  public static async close() {
    if (!this.started) return;
    this.status = this.STATE.CLOSING;

    await Promise.all([this.closeLogger(this.issueLogger)]);
    await Promise.all([this.waitLoggerClose(this.issueLogger)]);

    this.status = this.STATE.CLOSED;
  }

  private static onError(
    options: sigmate.Error.HandlerOptions<ErrorTypes>
  ): void {
    const { type = 'OTHER', error: cause } = options;
    let message = options.message || type;
    let critical = false;
    switch (type) {
      case 'NOT_STARTED':
        message = 'Logger initialzed before start';
        break;
      case 'LOGGER_CLOSE':
        break;
      default:
        critical = true;
        break;
    }
    if (critical) {
      this.status = Logger.STATE.FAILED;
    }
    throw new ServerError({
      name: 'LoggerError',
      message,
      cause,
      critical,
    });
  }

  issueLogger: WinstonLogger;
  analyticsLogger: WinstonLogger;
  debugLogger: WinstonLogger;

  constructor() {
    super();
    if (Logger.started) {
      this.onError({
        type: 'INIT',
        message: 'LoggerService initialized before start',
      });
    }
    this.issueLogger = Logger.issueLogger;
    this.analyticsLogger = Logger.analyticsLogger;
    this.debugLogger = Logger.debugLogger;
  }
  onError = Logger.onError;
}
