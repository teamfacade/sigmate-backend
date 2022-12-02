import { ValidationError as ExpressValidationErrorItem } from 'express-validator';
import RequestService from '../Request';
import ServerError from './ServerError';

type HttpStatusCode = number;

export type ValidationErrorItem = Omit<
  ExpressValidationErrorItem,
  'location'
> & {
  location: ExpressValidationErrorItem['location'] | 'database';
};

export interface RequestErrorOptions extends sigmate.Error.ServerErrorOptions {
  request?: RequestService;
  status?: number;
}

export default class RequestError extends ServerError {
  request?: RequestService;
  /**
   * HTTP response code to send to the client
   */
  status: HttpStatusCode;
  /**
   * Validation
   */
  validationErrors?: ValidationErrorItem[];
  /**
   * Sequelize foreign key constraint error handlers will populate
   * this attribute with conflicting DB column names (camelized)
   */
  fields?: string[];

  constructor(options: RequestErrorOptions) {
    const { name, status = 500, request, ...rest } = options;
    let level = options.level;
    if (!level) {
      switch (status) {
        case 400: // Bad Request
        case 401: // Unauthorized
        case 403: // Forbidden
        case 404: // Not Found
        case 405: // Method Not Allowed
        case 408: // Request Timeout
        case 409: // Conflict
        case 413: // Payload Too Large
        case 415: // Unsupported Media Type
        case 418: // I'm a teapot
        case 422: // Unprocessible Entity
        case 429: // Too Many Requests
          level = 'http';
          break;
        case 501: // Not Implemented
        case 503: // Service Unavailable
          level = 'info';
          break;
        case 500: // Internal Server Error
        default:
          level = 'warn';
          break;
      }
    }
    super({
      name: name || 'RequestError',
      level,
      ...rest,
    });
    this.status = status;
    this.request = request;
  }
}
