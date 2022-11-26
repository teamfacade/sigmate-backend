import RequestService from '../RequestService';
import AuthService from '../auth/AuthService';
import Logger from './Logger';

export default class RequestLogger extends Logger {
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
      level: 'silly',
      message,
      userId: this.auth.user.model?.id as number | undefined,
      deviceId: this.auth.device.model?.id as number | undefined,
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

  public logFinish(message = '', info: sigmate.Logger.LogInfoParam = {}) {
    let response: NonNullable<sigmate.Logger.LogInfo['request']>['response'] =
      undefined;
    if (this.request?.response?.status) {
      response = {
        status: this.request.response.status,
        // do not include body on logs of successful requests
        duration: this.request.response.duration,
        size: this.request.response.size,
      };
    }

    this.log({
      level: info.level || 'http',
      message,
      userId: this.auth.user.model?.id as number | undefined,
      deviceId: this.auth.device.model?.id as number | undefined,
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
