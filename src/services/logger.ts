import util from 'util';
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import winston, { format, Logger } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import ms from 'ms';
import stringify from 'json-stable-stringify';
import Service from '.';
import ServerError from '../errors';
import { timeoutAfter } from '../utils';
const { printf, colorize, json, combine, label, timestamp, padLevels } = format;

type LoggerOptions = {
  console: boolean;
  cloudWatchLogs: boolean;
};

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

export default class LoggerService extends Service {
  private static CONFIG = Object.freeze({
    cloudWatchLogs: {
      logGroup: {
        development: 'sigmate/development',
        test: 'sigmate/test',
        production: 'sigmate/production',
      },
      logStream: {
        issue: 'app/issue',
        analytics: 'app/analytics',
        debug: 'app/debug',
        auth: 'app/activites/auth',
        user: 'app/activites/user',
        mission: 'app/activities/reward/mission',
        point: 'app/activities/reward/point',
        tier: 'app/activities/reward/tier',
      },
    },
  });

  private static LEVEL = new Set<sigmate.Log.Level | string>([
    'error',
    'warn',
    'info',
    'http',
    'verbose',
    'debug',
    'silly',
  ]);

  private __cloudWatchLogs?: CloudWatchLogs;
  private get cloudWatchLogs() {
    if (!this.__cloudWatchLogs) throw new Error('Cloudwatch logs not set');
    return this.__cloudWatchLogs;
  }
  private get logGroup() {
    return LoggerService.CONFIG.cloudWatchLogs.logGroup[this.env];
  }
  private get logStream() {
    return LoggerService.CONFIG.cloudWatchLogs.logStream;
  }
  private issueLogger?: Logger;
  private analyticsLogger?: Logger;
  private debugLogger?: Logger;

  constructor() {
    super('Logger');
  }

  public log(info: sigmate.Optional<sigmate.Log.Info, 'message'>) {
    const logInfo: sigmate.Log.Info = {
      ...info,
      message: info.message || '',
    };

    if (this.status !== 'AVAILABLE') {
      if (this.env === 'development') {
        const level = this.formatLevel(logInfo.level);
        const message = this.formatMessage(logInfo);
        console.log(`[console] ${level} ${message}`);
        return;
      }
    }

    const winstonInfo: winston.LogEntry = {
      level: logInfo.level,
      message: this.formatMessage(logInfo),
    };

    this.issueLogger?.log(winstonInfo);
    this.analyticsLogger?.log(logInfo);
    this.debugLogger?.log(winstonInfo);
  }

  public async start() {
    this.setStatus('STARTING');
    try {
      this.__cloudWatchLogs = new CloudWatchLogs({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      switch (this.env) {
        case 'development':
        default:
          // this.initIssueLogger({ console: true, cloudWatchLogs: false });
          // this.initAnalyticsLogger({ console: true, cloudWatchLogs: false });
          this.initDebugLogger({ console: true, cloudWatchLogs: false });
          break;
        case 'test':
          this.initIssueLogger({ console: true, cloudWatchLogs: true });
          // this.initAnalyticsLogger({ console: true, cloudWatchLogs: false });
          break;
        case 'production':
          this.initIssueLogger({ console: false, cloudWatchLogs: true });
          this.initAnalyticsLogger({ console: false, cloudWatchLogs: true });
          break;
      }

      this.setStatus('AVAILABLE');
    } catch (error) {
      this.setStatus('UNAVAILABLE');
    }
  }

  private initIssueLogger(options: LoggerOptions) {
    this.checkLoggerOptions(options);
    const { console, cloudWatchLogs } = options;

    // Initialize issueLogger(il)
    const il = winston.createLogger({
      level: 'info',
      format: combine(
        label({ label: 'il' }), // issuelogger
        timestamp()
      ),
    });

    // Initialize transports
    if (console) {
      il.add(
        new winston.transports.Console({
          format: combine(padLevels(), this.colorizeLog, this.printableLog),
        })
      );
    }

    if (cloudWatchLogs) {
      il.add(
        new WinstonCloudWatch({
          cloudWatchLogs: this.cloudWatchLogs,
          logGroupName: this.logGroup,
          logStreamName: this.logStream.issue,
        })
      );
    }

    this.issueLogger = il;
  }

  private initAnalyticsLogger(options: LoggerOptions) {
    this.checkLoggerOptions(options);
    const { console, cloudWatchLogs } = options;

    const al = winston.createLogger({
      level: 'verbose',
      format: combine(
        label({ label: 'al', message: false }),
        timestamp(),
        json()
      ),
    });

    if (console) {
      al.add(new winston.transports.Console());
    }

    if (cloudWatchLogs) {
      al.add(
        new WinstonCloudWatch({
          cloudWatchLogs: this.cloudWatchLogs,
          logGroupName: this.logGroup,
          logStreamName: this.logStream.analytics,
        })
      );
    }

    this.analyticsLogger = al;
  }

  private initDebugLogger(options: LoggerOptions) {
    this.checkLoggerOptions(options);
    const { console, cloudWatchLogs } = options;

    const envLevel = process.env.DEBUG_LOG_LEVEL || 'debug';

    const dl = winston.createLogger({
      level: LoggerService.LEVEL.has(envLevel) ? envLevel : 'debug',
      format: combine(label({ label: 'dl' }), timestamp()),
    });

    if (console) {
      dl.add(
        new winston.transports.Console({
          format: combine(
            timestamp({ format: 'HH:mm:ss' }),
            padLevels(),
            this.colorizeLog,
            this.printableLog
          ),
        })
      );
    }

    if (cloudWatchLogs) {
      dl.add(
        new WinstonCloudWatch({
          cloudWatchLogs: this.cloudWatchLogs,
          logGroupName: this.logGroup,
          logStreamName: this.logStream.debug,
        })
      );
    }

    this.debugLogger = dl;
  }

  private checkLoggerOptions(options: LoggerOptions) {
    if (!options.console && !options.cloudWatchLogs) {
      throw new Error('Invalid logger options: No transport specified');
    }
  }

  private printableLog = printf((info) => {
    const { level = '-', message = '-', timestamp = '-', label = '-' } = info;
    return `[${label}] ${timestamp} ${level} ${message}`;
  });

  private colorizeLog = colorize({
    level: true,
    colors: {
      error: 'red',
      warn: 'yellow',
      info: 'green',
      http: 'magenta',
      verbose: 'blue',
      debug: 'dim white',
      silly: 'dim white',
    },
  });

  private formatMessage = (info: sigmate.Log.Info) => {
    const {
      message,
      source,
      event,
      name,
      status,
      duration,
      id,
      size,
      user,
      device,
      error,
      actionTarget,
      misc,
    } = info;
    let fMessage = '';
    if (source && source !== 'Request') {
      fMessage += `${source} `;
      if (name) fMessage += `'${name}' `;
    } else {
      if (name) fMessage += `${name} `;
    }
    if (status) fMessage += `${this.formatStatus(status)} `;
    if (message) fMessage += `${message} `;
    if (!status && !message && event) {
      fMessage += `${event} `;
    }
    if (duration) {
      fMessage += `(${ms(Number.parseFloat(duration.toFixed(3)))}) `;
    }
    if (size) {
      if (typeof size === 'number') {
        fMessage += `${this.formatByteSize(size)} `;
      } else {
        fMessage += `${this.formatByteSize(size.req)}`;
        if (size.res !== undefined) {
          fMessage += `/${this.formatByteSize(size.res)} `;
        } else {
          fMessage += ' ';
        }
      }
    }
    if (user) {
      const { id: uid, userName } = user;
      fMessage += `by ${userName}(${uid}) `;
    }
    if (device) {
      const { ip, ua, os, browser, model, type } = device;
      let fDevice: string = [type, os, browser, model]
        .filter((i) => Boolean(i))
        .join('/');
      if (!browser) {
        if (fDevice) fDevice += ' ';
        fDevice += ua;
      }
      fMessage += `from ${ip}(${fDevice}) `;
    }
    if (actionTarget) {
      const fTarget = actionTarget.map((t) => `${t.model}(${t.id})`).join(', ');
      fMessage += `on ${fTarget} `;
    }
    if (id) {
      fMessage += ` [${id}]`;
    }
    if (error) {
      fMessage += '\n';
      fMessage += this.formatError(error);
    }
    if (misc && Object.keys(misc).length > 0) {
      fMessage += '\n';

      fMessage += stringify(misc, {
        replacer: (key, value) => {
          // Do not stringify buffers
          if (value instanceof Buffer) {
            return `Buffer(${value.byteLength} B)`;
          }
          return value;
        },
      });
    }
    return fMessage;
  };

  private formatByteSize(size: number) {
    if (size < KB) return `${size}B`;
    else if (size < MB) return `${(size / KB).toFixed(2)}KB`;
    else if (size < GB) return `${(size / MB).toFixed(2)}MB`;
    else return `${(size / GB).toFixed(2)}GB`;
  }

  private formatError(error: unknown) {
    let fError = '';
    if (error instanceof ServerError) {
      if (error.cause) {
        fError += `${error.name}: ${error.message}\n`;
        fError += this.formatError(error.cause);
      } else {
        fError += error.stack || '';
      }
    } else if (error instanceof Error) {
      fError += util.inspect(error, {
        colors: false,
        depth: 5,
        breakLength: Infinity,
        sorted: false,
      });
    } else if (error) {
      fError = String(error);
    }
    return fError;
  }

  private formatLevel(level: string) {
    const padLength = level.length <= 7 ? 7 : level.length;
    return level + ' '.repeat(padLength - level.length);
  }

  private formatStatus(status: sigmate.AnyStatus | number) {
    let fStatus = typeof status === 'string' ? status.toLowerCase() : status;
    if (status === 'STARTING' || status === 'CLOSING') {
      fStatus += '...';
    }
    return fStatus;
  }

  private async closeLogger(logger: Logger | undefined) {
    if (!logger) return;
    logger.removeAllListeners('finish');
    const loggerFinish = new Promise<void>((resolve) =>
      logger.on('finish', () => resolve())
    );
    await timeoutAfter(loggerFinish, 3000);
    logger.end();
  }

  public async close() {
    if (!this.isAvailable) return;
    this.status = 'CLOSING';
    try {
      await Promise.all([
        this.closeLogger(this.issueLogger),
        this.closeLogger(this.analyticsLogger),
        this.closeLogger(this.debugLogger),
      ]);
    } catch (error) {
      this.status = 'UNAVAILABLE';
    } finally {
      this.status = 'CLOSED';
    }
  }
}

export const logger = new LoggerService();
