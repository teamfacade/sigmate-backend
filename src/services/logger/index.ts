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
import Server from '../servers/Server';
import Request from '../Request';
import Action from '../Action';
import LoggerError from '../errors/LoggerError';
import ActionError from '../errors/ActionError';
import RequestError from '../errors/RequestError';
import DatabaseError from '../errors/DatabaseError';
import { ServerStatus } from '../../utils/status';
import { Identifier } from 'sequelize/types';

type ErrorTypes = 'INIT' | 'NOT_STARTED' | 'LOGGER_CLOSE';

type LogArgs<
  TPKT extends Identifier = number,
  SPKT extends Identifier = number,
  PTPKT extends Identifier = TPKT,
  PSPKT extends Identifier = SPKT
> = {
  server?: Server;
  service?: Service;
  request?: Request;
  action?: Action<TPKT, SPKT, PTPKT, PSPKT>;
  message?: string;
  error?: unknown;
};

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
  private static env: typeof process.env.NODE_ENV = 'development';
  private static dynamoDB: DynamoDB = undefined as unknown as DynamoDB;
  private static cloudWatchLogs: CloudWatchLogs =
    undefined as unknown as CloudWatchLogs;
  private static issueLogger?: WinstonLogger = undefined;
  private static analyticsLogger?: WinstonLogger = undefined;
  private static debugLogger?: WinstonLogger = undefined;

  private static printableLog = printf((info) => {
    const { timestamp, level } = info;
    const message = formatMessage(info as sigmate.Logger.Info);
    return `${timestamp} ${padLevels(level, 7)} ${message}`;
  });

  private static dynamoLog = format((info) => {
    return createDynamoInfo(info as sigmate.Logger.Info);
  });

  private static colorizeLog = colorize({
    all: true,
    colors: {
      error: 'red',
      ERROR: 'red',
      warn: 'yellow',
      WARN: 'yellow',
      info: 'white',
      INFO: 'white',
      http: 'magenta',
      HTTP: 'magenta',
      verbose: 'blue',
      VERBOSE: 'blue',
      debug: 'dim white',
      DEBUG: 'dim white',
      silly: 'dim white',
      SILLY: 'dim white',
    },
  });

  private static initIssueLogger(options: {
    console: boolean;
    cloudWatchLogs: boolean;
  }) {
    const { console, cloudWatchLogs } = options;
    // A logger must have at least one transport
    if (!console && !cloudWatchLogs) {
      Logger.onError({
        message: 'No transport specified for issueLogger',
      });
    }
    const il = winston.createLogger({
      level: 'info',
      format: combine(timestamp(), Logger.printableLog),
    });

    // Add transport (console)
    if (console) {
      il.add(
        new winston.transports.Console({
          format: Logger.colorizeLog,
        })
      );
    }

    // Add transport (AWS CloudWatch Logs)
    if (cloudWatchLogs) {
      if (!Logger.cloudWatchLogs) Logger.onError({ type: 'NOT_STARTED' });
      il.add(
        new WinstonCloudWatch({
          cloudWatchLogs: Logger.cloudWatchLogs,
          logGroupName: Logger.AWS_CONFIG[Logger.env].CLOUDWATCH.LOG_GROUP,
          logStreamName: Logger.AWS_CONFIG[Logger.env].CLOUDWATCH.LOG_STREAM,
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
      Logger.onError({ message: 'No transport specified for analyticsLogger' });
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
            Logger.colorizeLog,
            printf((info) => JSON.stringify(info))
          ),
        })
      );
    }

    // Add transport (AWS Dynamo DB)
    if (dynamoDB) {
      if (!Logger.dynamoDB) Logger.onError({ type: 'NOT_STARTED' });
      al.add(
        new WinstonDynamoDB({
          dynamoDB: Logger.dynamoDB,
          tableName: Logger.AWS_CONFIG[Logger.env].DYNAMODB.TABLE,
        })
      );
    }

    Logger.analyticsLogger = al;
  }

  private static initDebugLogger(options: { console: boolean }) {
    const { console } = options;
    // A logger must have at least one transport
    if (!console) {
      Logger.onError({ message: 'No transport specified for debugLogger' });
    }

    const dl = winston.createLogger({
      level: process.env.DEBUG_LOG_LEVEL || 'debug',
      format: combine(
        timestamp({ format: 'HH:mm:ss' }),
        Logger.printableLog,
        Logger.colorizeLog
      ),
    });

    if (console) {
      dl.add(new winston.transports.Console());
    }

    Logger.debugLogger = dl;
  }

  public static start() {
    Logger.status = Logger.STATE.STARTING;
    const aws = config.aws;
    Logger.dynamoDB = new DynamoDB(aws.dynamoDB.logger);
    Logger.cloudWatchLogs = new CloudWatchLogs(aws.cloudWatchLogs.logger);
    Logger.env = process.env.NODE_ENV || 'development';
    switch (Logger.env) {
      case 'development':
        Logger.initDebugLogger({ console: true });
        break;
      case 'test':
        Logger.initDebugLogger({ console: true });
        Logger.initIssueLogger({ console: false, cloudWatchLogs: true });
        break;
      case 'production':
        Logger.initIssueLogger({ console: true, cloudWatchLogs: true });
        Logger.initAnalyticsLogger({ console: false, dynamoDB: true });
        break;
    }
    Logger.status = Logger.STATE.STARTED;
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
      this.onError({
        type: 'LOGGER_CLOSE',
        message: 'logger.end() failed',
        error,
      });
    }

    try {
      logger.close();
    } catch (error) {
      this.onError({
        type: 'LOGGER_CLOSE',
        message: 'logger.close() failed',
        error,
      });
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
  ): never {
    const { type = 'OTHER', error: cause } = options;
    const message = options.message || type;
    let critical = false;
    switch (type) {
      case 'LOGGER_CLOSE':
        critical = false;
        break;
      default:
        critical = true;
        break;
    }
    if (critical) {
      this.status = Logger.STATE.FAILED;
    }
    throw new LoggerError({ message, cause, critical });
  }

  issueLogger?: WinstonLogger;
  analyticsLogger?: WinstonLogger;
  debugLogger?: WinstonLogger;
  name = 'LOGGER';
  get serviceStatus() {
    return Logger.status;
  }

  constructor(options: { checkStart?: boolean } = {}) {
    super();
    const { checkStart = true } = options;
    if (!Logger.started && checkStart) {
      this.onError({
        type: 'INIT',
        message: 'LoggerService initialized before start',
      });
    }
    this.issueLogger = Logger.issueLogger;
    this.analyticsLogger = Logger.analyticsLogger;
    this.debugLogger = Logger.debugLogger;
  }
  start() {
    Logger.start();
    this.issueLogger = Logger.issueLogger;
    this.analyticsLogger = Logger.analyticsLogger;
    this.debugLogger = Logger.debugLogger;
    this.log({ service: this });
  }
  get started() {
    return Logger.started;
  }
  get onError() {
    return Logger.onError;
  }

  private getServerInfo(
    server: Server | undefined
  ): sigmate.Logger.Info['server'] {
    if (!server) return undefined;
    return {
      name: server.name,
      status: server.status,
    };
  }

  private getServiceInfo(
    service: Service | undefined
  ): sigmate.Logger.Info['service'] {
    if (!service) return undefined;
    return {
      name: service.name,
      status: service.serviceStatus,
    };
  }

  private getActionInfo<
    TPKT extends Identifier = number,
    SPKT extends Identifier = number,
    PTPKT extends Identifier = TPKT,
    PSPKT extends Identifier = SPKT
  >(
    action: Action<TPKT, SPKT, PTPKT, PSPKT> | undefined
  ): sigmate.Logger.Info['action'] {
    if (!action) return undefined;
    return {
      type: action.type,
      name: action.name,
      status: action.status,
      target: action.target
        ? {
            model: action.target.model.name,
            id: `${action.target.id}`,
          }
        : undefined,
      source: action.source
        ? {
            model: action.source.model.name,
            id: `${action.source.id}`,
          }
        : undefined,
      data: action.data,
      depth: action.depth,
    };
  }

  private getRequestInfo(
    request: Request | undefined
  ): sigmate.Logger.Info['request'] {
    if (!request) return undefined;
    return {
      method: request.method,
      endpoint: request.endpoint,
      size: request.size,
      query: request.query,
      params: request.params,
      body: request.body,
      response: request.response
        ? {
            status: request.response.status,
            size: request.response.size,
            body: request.response.body,
          }
        : undefined,
    };
  }

  private getErrorInfo(error: unknown): sigmate.Logger.Info {
    let level: sigmate.Logger.Level | undefined = undefined;
    let message = '<UNCAUGHT>';

    if (error instanceof ServerError) {
      level = error.level;
      message = error.critical ? '<CRITICAL>' : '';
    }

    if (error instanceof ActionError) {
      return {
        level: level || 'verbose',
        message,
        action: this.getActionInfo(error.action),
        error,
      };
    } else if (error instanceof RequestError) {
      return {
        level: level || 'http',
        message,
        request: this.getRequestInfo(error.request),
        error,
      };
    } else if (error instanceof DatabaseError) {
      return {
        level: level || 'debug',
        message,
        service: this.getServiceInfo(error.database),
        error,
      };
    } else if (error instanceof LoggerError) {
      return {
        level: level || 'debug',
        message,
        service: this.getServiceInfo(this),
        error,
      };
    } else if (error instanceof ServerError) {
      return {
        level: level || 'warn',
        message,
        server: this.getServerInfo(error.server),
        error,
      };
    } else if (error instanceof Error) {
      return {
        level: level || 'warn',
        message,
        error,
      };
    } else {
      return {
        level: 'error',
        message: 'UNEXPECTED_ERROR_TYPE',
      };
    }
  }

  public async log<
    TPKT extends Identifier = number,
    SPKT extends Identifier = number,
    PTPKT extends Identifier = TPKT,
    PSPKT extends Identifier = SPKT
  >(args: LogArgs<TPKT, SPKT, PTPKT, PSPKT>) {
    const { server, service, request, action, error } = args;
    let info: sigmate.Logger.Info;
    if (error) {
      info = this.getErrorInfo(error);
    } else {
      info = {
        level: 'info',
        message: args.message || '',
      };
      if (server) {
        info.server = this.getServerInfo(server);
        if (server.status <= ServerStatus.STARTING) {
          info.level = 'debug';
        }
      } else if (service) {
        info.service = this.getServiceInfo(service);
        info.level = 'debug';
      } else if (request) {
        info.request = this.getRequestInfo(request);
        info.id = {
          default: request.id,
        };
        // TODO auth user and device IDs
        info.level = 'http';
        info.duration = request.duration;
      } else if (action) {
        info.action = this.getActionInfo(action);
        // TODO auth user and device IDs
        info.level = action.ended ? 'verbose' : 'debug';
        info.duration = action.duration;
      }
    }
    this.issueLogger?.log(info);
    this.analyticsLogger?.log(info);
    this.debugLogger?.log(info);
  }
}
