import { v4 as uuidv4 } from 'uuid';
import e, { Request, RequestHandler } from 'express';
import isInt from 'validator/lib/isInt';
import { ParsedQs } from 'qs';

export type RequestHandlerTypes = {
  params?: Record<string, string>;
  query?: ParsedQs;
  body?: Record<string, unknown>;
  response?: string | Record<string, unknown>;
};

export type Controller<D extends RequestHandlerTypes> = RequestHandler<
  D['params'],
  D['response'],
  D['body'],
  D['query']
>;

export default class RequestUtil {
  static PG_DEFAULTS = {
    limit: 50,
    page: 1,
  };

  req: Request;
  constructor(req: Request) {
    this.req = req;
    req.logger = {
      id: uuidv4(),
      duration: -1 * performance.now(),
      headers: false,
      success: undefined,
    };
  }

  get id() {
    return this.logger.id;
  }

  get method() {
    return this.req.method;
  }

  get endpoint() {
    return (
      this.req.logger?.endpoint || this.req.originalUrl || this.req.url || ''
    );
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

  /** Returns HTTP request size in bytes (Value of HTTP `Content-Length` header) */
  get size() {
    let size = 0;

    const contentLength = this.req.header('content-length');
    if (contentLength && isInt(contentLength)) {
      size = Number.parseInt(contentLength);
    }

    return size;
  }

  /** Returns HTTP response size in bytes (Value of HTTP `Content-Length` header) */
  get resSize() {
    let size = 0;

    const res = this.req.res;
    if (res) {
      const contentLength = res.getHeader('content-length');
      if (contentLength) {
        if (typeof contentLength === 'string' && isInt(contentLength)) {
          size = Number.parseInt(contentLength);
        } else if (typeof contentLength === 'number') {
          size = contentLength;
        }
      }
    }

    return size;
  }

  get duration() {
    const d = this.req.logger?.duration;
    if (!d) return undefined;
    return d >= 0 ? d : undefined;
  }

  get logger() {
    return this.req.logger as NonNullable<typeof this.req.logger>;
  }

  get statusCode() {
    const res = this.req.res;
    return res?.statusCode ? res.statusCode : 0;
  }

  /**
   * Pass the response body to be logged.
   * Must be called before res.send() calls
   * @param body response body to send to client
   */
  public logBody(body: any) {
    this.logger.body = body;
  }

  /**
   * Pass any additional data to be logged
   * Must be called before res.send() calls
   * @param data additional data to leave in log
   */
  public logData(data: Record<string, unknown>) {
    this.logger.data = data;
  }

  /** Record request duration */
  public onHeaders() {
    this.logger.duration += performance.now();
    this.logger.headers = true;
  }

  /** Log the response */
  public onFinished() {
    const res = this.req.res;
    if (res && res.statusCode) {
      this.logger.success = 200 <= res.statusCode && res.statusCode < 300;
    } else {
      this.logger.success = false;
    }
  }

  private pg?: Required<sigmate.Request.PaginationReq>;
  public parsePgReq(): Required<sigmate.Request.PaginationReq> {
    if (!this.pg) {
      const defaults = RequestUtil.PG_DEFAULTS;
      let limit = defaults.limit;
      let page = defaults.page;

      const limitQuery = this.req.query.limit;
      if (limitQuery) {
        if (typeof limitQuery === 'string' && isInt(limitQuery)) {
          limit = Number.parseInt(limitQuery);
        } else if (typeof limitQuery === 'number') {
          limit = limitQuery;
        }
      }

      const pageQuery = this.req.query.page;
      if (pageQuery) {
        if (typeof pageQuery === 'string' && isInt(pageQuery)) {
          page = Number.parseInt(pageQuery);
        } else if (typeof pageQuery === 'number') {
          page = pageQuery;
        }
      }

      const offset = limit * (page - 1);

      this.pg = { limit, page, offset };
    }
    return this.pg;
  }

  public getPgRes(count: number): sigmate.Request.PaginationRes {
    const { limit, page, offset } = this.parsePgReq();

    return {
      limit,
      offset,
      page: {
        current: page,
        total: Math.ceil(count / limit),
      },
      count,
    };
  }
}
