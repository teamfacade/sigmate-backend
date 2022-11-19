import ServerError from './ServerError';

type RequestErrorOptions = sigmate.Errors.RequestErrorOptions;

export type HttpStatusCode = keyof typeof RequestError['HTTP_ERR_STATUS'];

export default class RequestError extends ServerError {
  static HTTP_ERR_STATUS = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    413: 'Payload Too Large',
    415: 'Unsupported Media Type',
    418: "I'm a teapot",
    422: 'Unprocessible Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    503: 'Service Unavaiable',
  };

  static getDefaultMessage(statusCode: HttpStatusCode) {
    if (statusCode in this.HTTP_ERR_STATUS) {
      return `${statusCode} ${this.HTTP_ERR_STATUS[statusCode]}`;
    }
    return `${statusCode} RequestError`;
  }

  statusCode: HttpStatusCode;
  clientMessage?: string;
  request?: sigmate.Services.RequestService;

  constructor(statusCode: HttpStatusCode, options: RequestErrorOptions) {
    const {
      message = RequestError.getDefaultMessage(statusCode),
      clientMessage,
      service,
      origin,
      unexpected,
      name = 'RequestError',
    } = options;
    super(message, { origin, unexpected, name });
    this.statusCode = statusCode;
    this.clientMessage = clientMessage;
    this.request = service;
  }
}
