import util from 'util';
import ms from 'ms';
import winston, { format, Logger } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import { Request } from 'express';
import BaseServer, { ServerStatus } from '../../servers';
import Service, { ServiceStatus } from '..';
import ServerError from '../errors/ServerError';
import LoggerError from '../errors/LoggerError';
import config from '../../config';
import { waitTimeout } from '../../utils';
import RequestUtil from '../../utils/RequestUtil';
import SingletonService from '../SingletonService';
import { ActionState, ActionStatus } from '../../utils/ActionNew';
import stringify from 'safe-stable-stringify';
import { DateTime } from 'luxon';
const { printf, colorize, json } = format;

type AllStatus = ServerStatus | ServiceStatus | ActionStatus;

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

export default class LoggerService extends SingletonService {
  public static instance: LoggerService;

  private static AWS = {
    CLOUDWATCHLOGS: {
      LOG_GROUP: {
        development: 'sigmate/development',
        test: 'sigmate/test',
        production: 'sigmate/production',
      },
      LOG_STREAM: {
        ISSUES: 'app/issues',
        ANALYTICS: 'app/analytics',
        RESTRICTIONS: 'app/restrictions',
        REWARDS: 'app/rewards',
      },
    },
  };

  /**
   * Log a stringified request and response body,
   * if it is smaller than this size (bytes)
   */
  private static MAX_BODY_SIZE = 1024;

  private static UNKNOWN_DEVICE = 'Unknown';

  issueLogger?: Logger;
  analyticsLogger?: Logger;
  debugLogger?: Logger;

  /** AWS CloudWatchLogs client instance */
  private __cloudWatchLogs?: CloudWatchLogs;

  public get cloudWatchLogs() {
    if (!this.__cloudWatchLogs) {
      throw new LoggerError({
        code: 'LOGGER/AWS/ER_CLOUDWATCH',
        message: 'Not initialized',
      });
    }
    return this.__cloudWatchLogs;
  }

  private set cloudWatchLogs(value) {
    this.__cloudWatchLogs = value;
  }

  constructor() {
    super({ name: 'Logger' });
    Service.logger = this;
  }

  public log({
    server,
    service,
    request,
    action,
    message,
    error,
    duration,
    printStatus,
    analytics,
  }: {
    server?: BaseServer;
    service?: Service;
    request?: Request;
    action?: ActionState;
    message?: string;
    error?: unknown;
    duration?: number;
    printStatus?: boolean;
    notify?: boolean;
    analytics?: boolean;
  }) {
    let info: sigmate.Logger.Info;
    if (server) {
      info = this.getServerInfo(server, error);
    } else if (service) {
      info = this.getServiceInfo(service, error);
    } else if (request) {
      info = this.getRequestInfo(request, error);
    } else if (action) {
      info = this.getActionInfo(action, error);
    } else {
      info = {
        level: 'info',
        message: message || '',
      };
    }

    info.timestamp = DateTime.utc().toISO();

    if (message) {
      info.message = `${info.message}${info.message ? '. ' : ''}${message}`;
    }
    if (error != undefined) {
      info.error = error;
      if (error instanceof ServerError && error.notify) {
        if (info.logOptions) {
          info.logOptions.notify = true;
        } else {
          info.logOptions = { notify: true };
        }
      }
    }

    if (duration !== undefined) info.duration = duration;
    if (printStatus) {
      if (info.logOptions) {
        info.logOptions.printStatus = true;
      } else {
        info.logOptions = { printStatus: true };
      }
    }

    if (this.isAvailable()) {
      try {
        this.issueLogger?.log(info);
      } catch (error) {
        console.error(error);
      }

      if (analytics) {
        try {
          this.analyticsLogger?.log(this.getAnalyticsInfo(info));
        } catch (error) {
          console.error(error);
        }
      }

      try {
        this.debugLogger?.log(info);
      } catch (error) {
        console.error(error);
      }
    } else {
      const message = this.formatMessage(info);
      console.log(message);
    }
  }

  public async start() {
    try {
      this.setStatus('STARTING');
      try {
        this.cloudWatchLogs = new CloudWatchLogs(
          config.aws.cloudWatchLogs.logger
        );
      } catch (error) {
        throw new LoggerError({ code: 'LOGGER/AWS/ER_CLOUDWATCH', error });
      }

      switch (process.env.NODE_ENV) {
        case 'development':
        default:
          this.initDebugLogger({ console: true });
          break;
        case 'test':
          this.initIssueLogger({ console: true, cloudWatchLogs: true });
          break;
        case 'production':
          this.initIssueLogger({ console: true, cloudWatchLogs: true });
          this.initAnalyticsLogger({ console: false, cloudWatchLogs: true });
          break;
      }

      this.setStatus('AVAILABLE');
    } catch (error) {
      this.setStatus('FAILED', error);
    }
  }

  /** Close a winston Logger */
  private async closeLogger(logger: winston.Logger | undefined) {
    if (!logger) return;

    await waitTimeout(
      new Promise<void>((resolve) => {
        logger.on('finish', () => resolve());
      }),
      5000
    );

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

    await waitTimeout(
      new Promise<void>((resolve) => {
        if (!logger) return resolve();
        logger.on('close', () => resolve());
      }),
      5000
    );
  }

  /** Closes LoggerService */
  public async close() {
    if (!this.started()) return;
    try {
      this.setStatus('CLOSING');

      await Promise.all([
        this.closeLogger(this.issueLogger),
        this.closeLogger(this.analyticsLogger),
        this.closeLogger(this.debugLogger),
      ]);

      this.setStatus('CLOSED');
    } catch (error) {
      this.setStatus('FAILED', error);
    }
  }

  // Logs error ~ info
  private initIssueLogger(options: {
    console: boolean;
    cloudWatchLogs: boolean;
  }) {
    const { console, cloudWatchLogs } = options;

    if (!console && !cloudWatchLogs) {
      throw new LoggerError({
        code: 'LOGGER/NF_TRANSPORT',
        message: 'issueLogger has no transport',
      });
    }

    const il = winston.createLogger({
      level: 'info',
      format: this.printableLog,
    });

    if (console) {
      il.add(
        new winston.transports.Console({
          format: this.colorizeLog,
        })
      );
    }

    if (cloudWatchLogs) {
      const env = process.env.NODE_ENV || 'development';
      const CWL = LoggerService.AWS.CLOUDWATCHLOGS;
      il.add(
        new WinstonCloudWatch({
          cloudWatchLogs: this.cloudWatchLogs,
          logGroupName: CWL.LOG_GROUP[env],
          logStreamName: CWL.LOG_STREAM.ISSUES,
        })
      );
    }

    this.issueLogger = il;
  }

  // Logs error ~ verbose
  private initAnalyticsLogger(options: {
    console: boolean;
    cloudWatchLogs: boolean;
  }) {
    const { console, cloudWatchLogs } = options;

    if (!console && !cloudWatchLogs) {
      throw new LoggerError({
        code: 'LOGGER/NF_TRANSPORT',
        message: 'analyticsLogger has no transport',
      });
    }

    const al = winston.createLogger({
      level: 'verbose',
      format: json(),
    });

    if (console) {
      al.add(new winston.transports.Console());
    }

    if (cloudWatchLogs) {
      const env = process.env.NODE_ENV || 'development';
      const CWL = LoggerService.AWS.CLOUDWATCHLOGS;

      al.add(
        new WinstonCloudWatch({
          cloudWatchLogs: this.cloudWatchLogs,
          logGroupName: CWL.LOG_GROUP[env],
          logStreamName: CWL.LOG_STREAM.ANALYTICS,
        })
      );
    }

    this.analyticsLogger = al;
  }

  // Logs error ~ debug
  private initDebugLogger(options: { console: boolean }) {
    const { console } = options;

    if (!console) {
      throw new LoggerError({
        code: 'LOGGER/NF_TRANSPORT',
        message: 'debugLogger has no transport',
      });
    }

    const dl = winston.createLogger({
      level: process.env.DEBUG_LOG_LEVEL || 'debug',
      format: this.printableLog,
    });

    if (console) {
      dl.add(
        new winston.transports.Console({
          format: this.colorizeLog,
        })
      );
    }

    this.debugLogger = dl;
  }

  private getAnalyticsInfo(
    info: sigmate.Logger.Info
  ): sigmate.Logger.AnalyticsInfo {
    let timestamp: DateTime;
    try {
      timestamp = info.timestamp
        ? DateTime.fromISO(info.timestamp)
        : DateTime.utc();
    } catch (error) {
      timestamp = DateTime.utc();
    }

    let type: sigmate.Logger.AnalyticsInfo['type'];
    let name: sigmate.Logger.AnalyticsInfo['name'];
    let size: sigmate.Logger.AnalyticsInfo['size'] = undefined;
    let error: sigmate.Logger.AnalyticsInfo['error'] = undefined;

    if (info.server) {
      type = 'server';
      name = info.server.name;
    } else if (info.service) {
      type = 'service';
      name = info.service.name;
    } else if (info.request) {
      type = 'request';
      name = `${info.request.method} ${info.request.endpoint} ${
        info.request.response?.status || ''
      }`;
      size = {
        request: info.request.size,
        response: info.request.response?.size,
      };
    } else if (info.action) {
      type = 'action';
      name = info.action.name;
    } else if (info.error) {
      type = 'error';
      if (info.error instanceof ServerError) {
        name = info.error.code || info.error.name || info.error.message;
        error = {
          code: info.error.code,
          name: info.error.name,
          message: info.error.message,
        };
      } else if (info.error instanceof Error) {
        name = info.error.name || info.error.message;
        error = {
          name: info.error.name,
          message: info.error.message,
        };
      } else {
        name = 'ERROR';
      }
    } else {
      type = 'other';
      name = 'other';
    }

    return {
      timestamp: timestamp.toMillis(),
      level: info.level,
      message: info.message,
      type,
      name,
      duration: info.duration,
      id: info.id,
      user: info.user,
      device: info.device,
      location: info.location,
      size,
      metric: info.action ? info.action.metric : undefined,
      target: info.action ? info.action.target : undefined,
      source: info.action ? info.action.source : undefined,
      error,
    };
  }

  private getServerInfo(
    server: BaseServer,
    error?: unknown
  ): sigmate.Logger.Info {
    // Level
    let level: sigmate.Logger.Level;
    if (error) {
      level = server.status === 'FAILED' ? 'error' : 'warn';
    } else {
      switch (server.status) {
        case 'STARTING':
          level = 'debug';
          break;
        case 'STARTED':
          level = 'info';
          break;
        case 'CLOSING':
          level = 'warn';
          break;
        case 'CLOSED':
          level = 'info';
          break;
        case 'FAILED':
          level = 'error';
          break;
        default:
          level = 'info';
          break;
      }
    }

    return {
      level,
      message: '',
      id: server.id,
      server: {
        name: server.name,
        status: server.status,
      },
    };
  }

  private getServiceInfo(service: Service, error?: unknown) {
    let level: sigmate.Logger.Level;
    if (error) {
      level = service.status === 'FAILED' ? 'error' : 'warn';
      if (error instanceof ServerError) {
        if (error.logLevel) {
          level = error.logLevel;
        }
      }
    } else {
      switch (service.status) {
        case 'STARTING':
        case 'STARTED':
        case 'CLOSING':
        case 'CLOSED':
          level = 'debug';
          break;
        case 'AVAILABLE':
          level = 'verbose';
          break;
        case 'UNAVAILABLE':
          level = 'warn';
          break;
        case 'FAILED':
          level = 'error';
          break;
        default:
          level = 'info';
          break;
      }
    }

    return {
      level,
      message: '',
      service: {
        name: service.name,
        status: service.status,
      },
    };
  }

  private getRequestInfo(req: Request, error?: unknown): sigmate.Logger.Info {
    let level: sigmate.Logger.Level = 'http';
    if (error) {
      if (error instanceof ServerError) {
        if (error.logLevel) {
          level = error.logLevel;
        } else {
          level = 'warn';
        }
      } else {
        level = 'error';
      }
    }

    const reqUtil = req.util || new RequestUtil(req);
    const info: sigmate.Logger.Info = {
      level,
      message: '',
      duration: reqUtil.duration,
      id: reqUtil.id,
      // TODO user,
      ...this.getDeviceLocation(reqUtil), // device, location
      request: {
        method: reqUtil.method,
        endpoint: reqUtil.endpoint,
        size: reqUtil.size,
        query: reqUtil.query,
        params: reqUtil.params,
        body: reqUtil.body,
      },
    };

    if (reqUtil.logger.headers) {
      const request = info.request as NonNullable<
        sigmate.Logger.Info['request']
      >;
      request.response = {
        status: reqUtil.statusCode,
        size: reqUtil.resSize,
        body: reqUtil.logger.body,
      };
      request.data = reqUtil.logger.data;
    }

    return info;
  }

  private getActionInfo(
    actionState: ActionState,
    err?: unknown
  ): sigmate.Logger.Info {
    const { action, status, duration, target, source, metric, req } =
      actionState;

    const { name, type } = action;

    const error = err || actionState.error;

    let level: sigmate.Logger.Level;
    if (error) {
      if (error instanceof ServerError) {
        level = error.logLevel || 'error';
      } else {
        level = 'error';
      }
    } else {
      switch (status) {
        case 'FINISHED':
          level = 'verbose';
          break;
        case 'FAILED':
          level = 'verbose';
          break;
        default:
          level = 'debug';
          break;
      }
    }

    const info: sigmate.Logger.Info = {
      level,
      message: '',
      duration,
      id: req?.util?.id,
      // TODO user
      ...this.getDeviceLocation(req?.util), // device, location
      action: {
        type: type,
        name: name,
        status,
        target: target?.id
          ? (target as Required<ActionState['target']>)
          : undefined,
        source: source?.id
          ? (source as Required<ActionState['source']>)
          : undefined,
        metric,
      },
    };

    return info;
  }

  private printableLog = printf((info) => {
    const { timestamp, level } = info;
    const message = this.formatMessage(info as sigmate.Logger.Info);
    return `${timestamp} ${this.formatLevel(
      level as sigmate.Logger.Level
    )} ${message}`;
  });

  private colorizeLog = colorize({
    all: true,
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

  private getDeviceLocation(reqUtil: RequestUtil | undefined) {
    if (!reqUtil) return {};
    const device: sigmate.Logger.Info['device'] = reqUtil.req.device;
    const location: sigmate.Logger.Info['location'] =
      reqUtil.req.location?.ipv4 || reqUtil.req.location?.ipv6;
    return { device, location };
  }

  private formatMessage(info: sigmate.Logger.Info): string {
    const {
      duration,
      user,
      device,
      location,
      error,
      logOptions = {},
      server,
      service,
      request,
      action,
    } = info;
    const { printStatus = false, notify = false } = logOptions;

    const ffMessage = {
      flag: '',
      type: '',
      name: '',
      status: '',
      size: -1,
      subject: '',
      target: '',
      source: '',
      message: '',
      id: '',
    };
    const logData: Record<string, unknown> = {};

    if (notify) {
      ffMessage.flag = 'NOTIFY';
    }

    if (error instanceof ServerError && error.critical) {
      ffMessage.flag = 'CRITICAL';
    }

    if (server) {
      ffMessage.type = 'SERVER';
      ffMessage.name = server.name;
      ffMessage.status = server.status;
    } else if (service) {
      ffMessage.type = 'SERVICE';
      ffMessage.name = service.name;
      ffMessage.status = service.status;
    } else if (request) {
      const { method, endpoint, query, params, response } = request;
      if (!response) {
        // Request
        ffMessage.name = `${method} ${endpoint}`;
        if (typeof request.size === 'number') ffMessage.size = request.size;
      } else {
        // Response
        const { status } = response;
        ffMessage.name = `${status} ${endpoint}`;
        if (typeof response.size === 'number') ffMessage.size = response.size;
        if (status === 500) {
          logData.request = {
            query,
            params,
            body:
              request.size && request.size < LoggerService.MAX_BODY_SIZE
                ? request.body
                : '...',
          };
          logData.response = {
            body:
              response.size && response.size < LoggerService.MAX_BODY_SIZE
                ? response.body
                : '...',
          };
        }
      }
    } else if (action) {
      const { type, target, source, metric } = action;
      const fType = type ? `(${type[0]})` : '';
      ffMessage.type = `ACTION${fType || ''}`;
      ffMessage.name = action.name;
      ffMessage.status = action.status;
      if (target) ffMessage.target = `${target.model}:${target.id}`;
      if (source) ffMessage.source = `${source.model}:${source.id}`;
      if (metric) logData.metric = metric;
    }

    let fMessage = '';
    const { flag, type, name, status, size, target, source } = ffMessage;
    if (flag) fMessage += `**${flag}** `;
    if (type) fMessage += `${type} `;
    if (name) fMessage += `${name} `;
    if (printStatus && status) fMessage += `${status} `;
    if (size >= 0) fMessage += `${this.formatSize(size)} `;
    if (duration !== undefined && duration >= 0)
      fMessage += `(${ms(duration)}) `;
    const subject: string[] = [];
    if (user) subject.push(user);
    if (location) subject.push(location);
    if (device) {
      const fDevice = this.formatDevice(device);
      if (fDevice === LoggerService.UNKNOWN_DEVICE) {
        logData.device = device;
      }
      subject.push(fDevice);
    }
    if (subject.length > 0) fMessage += `BY ${subject.join(':')} `;
    if (target) fMessage += `ON ${target} `;
    if (source) fMessage += `FROM ${source} `;
    if (info.message) fMessage += info.message;
    if (error) {
      if (fMessage) fMessage += '\n\t';
      fMessage += this.formatError(error);
    }
    if (Object.keys(logData).length > 0) {
      fMessage += '\n';
      fMessage = stringify(logData);
    }

    return fMessage;
  }

  private formatDevice(result: UAParser.IResult) {
    const { browser, engine, os, device } = result;
    const fDevice: string[] = [];

    if (browser.name) {
      fDevice.push(browser.name);
    } else if (engine.name) {
      fDevice.push(engine.name);
    }

    if (os.name) fDevice.push(os.name);

    if (device) {
      const { model, vendor, type } = device;
      const deviceStr = model || vendor || type;
      if (deviceStr) fDevice.push(deviceStr);
    }

    return fDevice.length ? fDevice.join('/') : LoggerService.UNKNOWN_DEVICE;
  }

  private formatSize(size: number) {
    if (size < KB) {
      return `${size}B`;
    } else if (size < MB) {
      return `${(size / KB).toFixed(2)}KB`;
    } else if (size < GB) {
      return `${(size / MB).toFixed(2)}MB`;
    } else {
      return `${(size / GB).toFixed(2)}GB`;
    }
  }

  private formatLevel(level: sigmate.Logger.Level) {
    const padLength = level.length > 7 ? 7 : level.length;
    return level.toUpperCase() + ' '.repeat(padLength - level.length);
  }

  private formatError(error: unknown) {
    let fMessage = '';
    if (error instanceof ServerError) {
      if (error.cause) {
        fMessage += `${error.name}: ${error.message}\n`;
        fMessage += this.formatError(error.cause);
      } else {
        fMessage += error.stack || '';
      }
    } else if (error instanceof Error) {
      fMessage += util.inspect(error, {
        colors: false,
        depth: 5,
        breakLength: Infinity,
        sorted: false,
      });
    } else {
      fMessage += String(error);
    }
    return fMessage;
  }

  private formatStatus(
    status: AllStatus,
    options: { lower?: boolean; dots?: boolean } = {}
  ): string {
    let fStatus: string = status;
    if (options?.lower) {
      fStatus = fStatus.toLowerCase();
    }

    if (options?.dots) {
      if (status === 'STARTING' || status === 'CLOSING') {
        fStatus += '...';
      }
    }

    return fStatus;
  }
}

export const logger = new LoggerService();
