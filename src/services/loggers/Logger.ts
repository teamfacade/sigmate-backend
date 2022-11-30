import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { Logger as WinstonLogger } from 'winston';
// const { timestamp } = format;
import Service from '..';
import config from '../../config';
import ServerError from '../errors/ServerError';
import { ServiceStatus } from '../status';

type ErrorTypes = 'INIT';

export default class Logger extends Service {
  // For key shortening and expansion on DynamoDB
  static CLOUDWATCH_LOG_GROUP_PROD = 'sigmate-app';
  static CLOUDWATCH_LOG_STREAM_PROD = 'production-1';
  static CLOUDWATCH_LOG_GROUP_TEST = 'sigmate-app';
  static CLOUDWATCH_LOG_STREAM_TEST = 'production-1';
  static CLOUDWATCH_LOG_GROUP_DEV = 'sigmate-app-dev';
  static CLOUDWATCH_LOG_STREAM_DEV = 'dev-1';
  static DYNAMODB_TABLE_PROD = 'sigmate-app-log';

  static dynamoDB: DynamoDB = undefined as unknown as DynamoDB;
  static cloudWatchLogs: CloudWatchLogs =
    undefined as unknown as CloudWatchLogs;
  static issueLogger: WinstonLogger;
  static analyticsLogger: WinstonLogger;
  static debugLogger: WinstonLogger;

  static start() {
    const aws = config.aws;
    this.dynamoDB = new DynamoDB(aws.dynamoDB.logger);
    this.cloudWatchLogs = new CloudWatchLogs(aws.cloudWatchLogs.logger);
    Logger.status = ServiceStatus.STARTED;
  }

  dynamoDB: DynamoDB;
  cloudWatchLogs: CloudWatchLogs;
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
    this.dynamoDB = Logger.dynamoDB;
    this.cloudWatchLogs = Logger.cloudWatchLogs;
    this.issueLogger = Logger.issueLogger;
    this.analyticsLogger = Logger.analyticsLogger;
    this.debugLogger = Logger.debugLogger;
  }

  private onError(options: sigmate.Error.HandlerOptions<ErrorTypes>): void {
    const { type = 'OTHER', error: origin } = options;
    const message = options.message || type;
    let critical = false;
    switch (type) {
      default:
        critical = true;
        break;
    }
    throw new ServerError({
      name: 'LoggerError',
      message,
      cause: origin,
      critical,
    });
  }
}
