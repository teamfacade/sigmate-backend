import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';
import isInt from 'validator/lib/isInt';
import { Request, Response } from 'express';

export default class RequestMetadata {
  req: Request;
  res: Response;

  id: string;
  size: sigmate.ResMetaSize;
  success: boolean | null;
  requestedAt: DateTime;
  error?: unknown;
  private __duration: number;
  public get duration() {
    return this.__duration >= 0 ? this.__duration : undefined;
  }

  get status() {
    return this.res.statusCode;
  }

  get method() {
    return this.req.method;
  }

  get endpoint() {
    return this.req.originalUrl || this.req.url || '';
  }

  get responseBody() {
    return this.res.body;
  }

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
    this.id = uuidv4();
    this.size = {
      req: this.parseSize(req.header('content-length')),
    };
    this.success = null;
    this.requestedAt = DateTime.now();
    this.__duration = -1 * performance.now();
  }

  headers() {
    this.__duration += performance.now();
    this.size.res = this.parseSize(this.res.getHeader('content-length'));
    this.success = 200 <= this.status && this.status < 300;
  }

  finish() {
    this.success = 200 <= this.status && this.status < 300;
  }

  private parseSize(size: string | number | string[] | undefined) {
    let sizeNumber = 0;
    if (typeof size === 'string' && isInt(size)) {
      sizeNumber = Number.parseInt(size);
    } else if (typeof size === 'number') {
      sizeNumber = size;
    }
    return sizeNumber;
  }
}
