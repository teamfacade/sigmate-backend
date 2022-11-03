import RequestService from '../../RequestService';
import AuthService from '../auth/AuthService';
import LoggerService from './LoggerService';

export default class RequestLoggerService extends LoggerService {
  request: RequestService;
  auth: AuthService;

  startedAt?: number;
  endedAt?: number;

  constructor(request: RequestService, auth: AuthService) {
    super();
    this.request = request;
    this.auth = auth;
  }

  /**
   * Log the start of a HTTP request process flow
   * The request start log does not contain the contents of HTTP request body
   * @param message Description about the error to include in the log
   */
  public logStart(message = '') {
    this.log({
      level: 'http',
      message,
      userId: this.auth.user?.id as number | undefined, // TODO correct type
      deviceId: this.auth.device?.id as number | undefined, // TODO correct type
      status: {
        request: 'STARTED',
      },
      request: {
        id: this.request.id,
        method: this.request.method,
        endpoint: this.request.endpoint,
        query: this.request.query,
        params: this.request.params,
        size: this.request.size,
      },
    });
  }

  public logProgress(message = '', info: sigmate.Logger.LogInfoParam = {}) {
    this.log({
      level: info.level || 'info',
      message,
      userId: this.auth.user?.id as number | undefined, // TODO correct type
      deviceId: this.auth.device?.id as number | undefined, // TODO correct type
      status: {
        request: 'IN_PROGRESS',
      },
      request: {
        id: this.request.id,
        method: this.request.method,
        endpoint: this.request.endpoint,
        ...info.request,
      },
      ...info,
    });
  }

  public logFinish(message = '', info: sigmate.Logger.LogInfoParam = {}) {
    let response: NonNullable<sigmate.Logger.LogInfo['request']>['response'] =
      undefined;
    if (this.request?.response?.status) {
      response = {
        status: this.request.response.status,
        body: this.request.response.body,
        duration: this.request.response.duration,
        size: this.request.response.size,
      };
    }

    // TODO
    this.log({
      level: info.level || 'http',
      message,
      userId: this.auth.user?.id as number | undefined, // TODO correct type
      deviceId: this.auth.device?.id as number | undefined, // TODO correct type
      status: {
        request: 'FINISHED',
      },
      request: {
        id: this.request.id,
        method: this.request.method,
        endpoint: this.request.endpoint,
        response,
      },
      ...info,
    });
  }

  // public logError(message = '', info: sigmate.Logger.LogInfoParam = {}) {
  // TODO implement logging of RequestError
  // }
}
