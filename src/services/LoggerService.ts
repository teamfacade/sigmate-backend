import { Logger } from 'winston';
import BaseServer from '../servers';
import { isEnv } from '../utils';
import ServiceError from './errors/ServiceError';
import Service, { ServiceOptions } from '.';

export default class LoggerService extends Service {
  issueLogger?: Logger;
  analyticsLogger?: Logger;
  debugLogger?: Logger;

  constructor({ createInstance }: ServiceOptions) {
    if (LoggerService.instance) {
      throw new ServiceError({ code: 'SERVICE/ALREADY_INIT' });
    }
    super({ name: 'Logger', createInstance });

    if (isEnv('development')) {
      this.initDebugLogger();
    } else {
      this.initIssueLogger();
      this.initAnalyticsLogger();
    }
  }

  public log({
    server,
    service,
    // request,
    // action,
    message,
    error,
    duration,
  }: {
    server?: BaseServer;
    service?: Service;
    request?: any;
    action?: any;
    message?: string;
    error?: unknown;
    duration?: number;
  }) {
    let info: sigmate.Logger.Info;
    if (server) {
      info = this.getServerInfo(server);
    } else if (service) {
      info = this.getServiceInfo(service);
    } else {
      info = {
        level: 'info',
        message: message || '',
      };
    }

    if (message) info.message = `${message}. ${info.message}`;
    if (error != undefined) info.error = error;
    if (duration !== undefined) info.duration = duration;

    this.issueLogger?.log(info);
    this.analyticsLogger?.log(info);
    this.debugLogger?.log(info);
  }

  // Logs error ~ info
  private initIssueLogger() {
    // TODO
  }

  // Logs error ~ verbose
  private initAnalyticsLogger() {
    // TODO
  }

  // Logs error ~ debug
  private initDebugLogger() {
    // TODO
  }

  private getServerInfo(server: BaseServer): sigmate.Logger.Info {
    // Level
    let level: sigmate.Logger.Level;
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

    return {
      level,
      message: '',
      id: {
        default: server.id,
      },
      server: {
        name: server.name,
        status: server.status,
      },
    };
  }

  private getServiceInfo(service: Service) {
    let level: sigmate.Logger.Level;
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

    return {
      level,
      message: '',
      service: {
        name: service.name,
        status: service.status,
      },
    };
  }
}
