import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import onHeaders from 'on-headers';
import Service from './Service';
import { RequestStatus } from '../utils/status';

type RequestOptions = {
  req: Request;
  res: Response;
};

type SendOptions = {
  status?: number;
  json?: Record<string, unknown>;
};

export default class RequestService extends Service {
  static start() {
    this.status = RequestService.STATE.STARTED;
  }

  public static mw() {
    return (req: Request, res: Response, next: NextFunction) => {
      req.service = new RequestService({ req, res });
      onHeaders(res, () => {
        req.service.onSend(res);
      });
      res.service = req.service;
      next();
    };
  }

  id = uuidv4();
  name = 'REQUEST';
  status = RequestStatus.STARTED;
  req: Request; // Express request
  res: Response; // Express response
  __duration = performance.now();
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
    return (this.req.route.path as string) || '';
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
  /**
   * Size of the request payload in bytes.
   * For JSON objects, the byte size of req.body stringified.
   * For file(s), the (total) size of the file(s) in bytes.
   * For multipart forms, the sum of the above.
   */
  __size = -1;
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

  constructor(options: RequestOptions) {
    super();
    this.req = options.req;
    this.res = options.res;
  }

  /** Event handler: on response send */
  async onSend(res: Response) {
    const contentLength =
      (res.getHeader('Content-Length') as string | undefined) || '0';
    const size = Number.parseInt(contentLength);
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
  }
  /**
   * Response send method to use instead of built-in Express methods
   * so that the response body can be captured and logged
   */
  send(options: SendOptions) {
    const { status = 200, json: body } = options;
    if (!this.response) {
      this.response = {
        size: 0,
        status: this.res.statusCode,
        body,
      };
    } else {
      this.response.body = body;
    }
    this.res.status(status).json(body || {});
  }
}
