import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Service from './Service';
import { RequestStatus } from '../utils/status';
import Logger from './logger';
import ServerError from './errors/ServerError';

type RequestOptions = {
  req: Request; // Express request
  res: Response; // Express response
};

export const PG_DEFAULT_LIMIT = 50;

export default class RequestService extends Service {
  static logger?: Logger;

  public static start() {
    this.status = this.STATE.STARTED;
  }

  id = uuidv4();
  name = 'REQUEST';
  status = RequestStatus.STARTED;
  req: Request; // Express request
  res: Response; // Express response
  private __duration = performance.now();
  get duration() {
    if (this.status >= RequestStatus.FINISHED) {
      return this.__duration;
    }
    return undefined;
  }
  get method() {
    return this.req.method;
  }
  get endpoint() {
    return this.req.originalUrl || this.req.url || '';
  }
  get query() {
    return this.req.query;
  }
  get params() {
    return this.req.params;
  }
  get body() {
    return this.req.body;
  }
  private __size = -1;
  /**
   * Size of the request payload in bytes.
   * Reads values from the HTTP 'Content-Length' header
   */
  get size() {
    if (this.__size < 0) {
      let size = 0;
      // Check for content-length header in request
      const contentLength = this.req.header('content-length');
      if (contentLength) {
        const parsed = Number.parseInt(contentLength);
        if (!isNaN(parsed)) {
          size = parsed;
        }
      }
      this.__size = size;
    }
    return this.__size;
  }
  response: NonNullable<sigmate.Logger.Info['request']>['response'];
  get serviceStatus() {
    return RequestService.status;
  }
  logger?: Logger;
  pagination?: sigmate.Request.PaginationRes;
  get pg() {
    return this.pagination;
  }

  constructor(options: RequestOptions) {
    super();
    this.req = options.req;
    this.res = options.res;
    this.logger = RequestService.logger;
    this.logger?.log({ request: this });
  }

  /** Event handler: on response send */
  onSend(res: Response) {
    const contentLength =
      (res.getHeader('Content-Length') as string | undefined) || '0';
    let size = Number.parseInt(contentLength);
    if (isNaN(size)) size = 0;
    if (!this.response) {
      this.response = {
        size,
        status: res.statusCode,
      };
    } else {
      this.response.size = size;
      this.response.status = res.statusCode;
    }
    if (200 <= res.statusCode && res.statusCode < 300) {
      this.status = RequestStatus.FINISHED;
    } else {
      this.status = RequestStatus.FAILED;
    }
    this.__duration = performance.now() - this.__duration;
    this.logger?.log({ request: this });
  }

  setPagination(dto: sigmate.Request.PaginationDTO) {
    this.pagination = {
      limit: dto.limit || this.pagination?.limit || PG_DEFAULT_LIMIT,
      offset: dto.offset || this.pagination?.offset || 0,
      page: {
        current: dto.page || this.pagination?.page.current || 0,
        total: this.pagination?.page.total || 0,
      },
      count: dto.count || this.pagination?.count || 0,
    };

    if (dto.limit && this.pagination.page.current) {
      this.pagination.offset =
        this.pagination.limit + (this.pagination.page.current + 1);
    }

    if (dto.offset) {
      // Use offset as priority
      const dv = this.pagination.offset / this.pagination.limit;
      const floor = Math.floor(dv);
      const ceil = Math.ceil(dv);
      if (floor === ceil) {
        // Calculate current page
        this.pagination.page.current = floor + 1;
        if (this.pagination.count) {
          // Calculate total page
          this.pagination.page.total = Math.ceil(
            this.pagination.count / this.pagination.limit
          );
        }
      } else {
        // Offset is non-standard (doesnt fit page divisions)
        // Set page information to 0
        this.pagination.page.current = 0;
        this.pagination.page.total = 0;
      }
    } else if (dto.page) {
      // Use current page as priority
      this.pagination.offset =
        this.pagination.limit * (this.pagination.page.current - 1);
    }

    if (this.pagination.limit && this.pagination.count) {
      this.pagination.page.total = Math.ceil(
        this.pagination.count / this.pagination.limit
      );
    }
  }

  sendError(error: unknown) {
    const err =
      error instanceof ServerError
        ? error
        : new ServerError({
            name: 'ServerError',
            code: 'UNKNOWN/ER_UNHANDLED',
            error,
            label: {
              source: 'SERVER',
              name: 'APP',
            },
            message: 'Unexpected internal server error',
            httpStatus: 500,
          });

    this.res.status(err.httpStatus).json({
      success: false,
      error: {
        code: err.code,
        msg: err.message,
      },
    });
  }
}
