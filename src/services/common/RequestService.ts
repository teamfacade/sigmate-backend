import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import multer from 'multer';

type RequestStatus = 0 | 1 | 2 | 3;
export default class RequestService {
  static NOT_STARTED: 0 = 0;
  static STARTED: 1 = 1;
  static FINISHED: 2 = 2;
  static ERROR: 3 = 3;

  /**
   * Unique ID for this client's request.
   * Use uuid v4.
   */
  id: string;

  /**
   * Current status of this request
   */
  status: RequestStatus = RequestService.NOT_STARTED;

  /**
   * Express Request object
   */
  req: Request;

  /**
   * When the request was received
   */
  startedAt?: number;
  /**
   * When a response for this request was sent
   */
  endedAt?: number;

  response: NonNullable<sigmate.Logger.LogInfo['request']>['response'];

  constructor(req: Request) {
    this.id = uuidv4();
    this.req = req;
  }

  start() {
    this.startedAt = performance.now();
    this.endedAt = undefined;
  }

  finish(res: Response, payload: any, size = -1) {
    this.endedAt = performance.now();
    this.response = {
      status: res.statusCode,
      body: payload,
      duration: this.endedAt - (this.startedAt || this.endedAt),
      size:
        size >= 0
          ? size
          : payload
          ? Buffer.byteLength(JSON.stringify(payload))
          : 0,
    };
  }

  get method() {
    return this.req.method;
  }

  get endpoint() {
    // TODO test if this returns
    return this.req.route.path as string;
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
  get size() {
    const req = this.req;
    let size = 0;

    // For (encoded) form data
    if (req.body) {
      size += Buffer.byteLength(JSON.stringify(this.req.body));
    }

    // For multer single file uploads
    if (req.file) {
      size += req.file.size;
    }

    // For multer multiple file uploads
    if (req.files) {
      if (req.files instanceof Array) {
        req.files.forEach((file) => {
          size += file.size;
        });
      } else {
        for (const k in req.files) {
          const files = req.files[k];
          files.forEach((file) => {
            size += file.size;
          });
        }
      }
    }
    return size;
  }
}
