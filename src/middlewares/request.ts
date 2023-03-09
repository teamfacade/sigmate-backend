import { v4 as uuidv4 } from 'uuid';
import { query } from 'express-validator';
import { Request, Response, RequestHandler } from 'express';
import onFinished from 'on-finished';
import onHeaders from 'on-headers';
import isInt from 'validator/lib/isInt';
import MySqlValidators from './validators/mysql';
import { logger } from '../services/logger';
import ClientDevice from '../utils/device';
import { DateTime } from 'luxon';
import ServerError from '../errors';

type MetadataMwOptions = {
  log?: boolean;
};

export class RequestMetadata {
  req: Request;
  res: Response;

  id: string;
  size: {
    req: number;
    res?: number;
  };
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

export default class RequestMw {
  public static device = (): RequestHandler => {
    return (req, res, next) => {
      req.device = new ClientDevice({ req });
      next();
    };
  };

  public static metadata = (
    options: MetadataMwOptions = {}
  ): RequestHandler => {
    return (req, res, next) => {
      const meta = new RequestMetadata(req, res);
      const getLogUser = this.createLogUserGetter(req);
      const getLogDevice = this.createLogDeviceGetter(req);

      req.meta = meta;
      req.getLogUser = getLogUser;
      req.getLogDevice = getLogDevice;
      res.meta = this.createMetadataBuilder(meta, req, res);

      if (options.log) {
        const oldJson = res.json.bind(res);
        res.json = function (body: any) {
          res.body = body;
          return oldJson(body);
        };

        logger.log({
          level: 'debug',
          source: 'Request',
          event: 'REQ/START',
          name: `${meta.method} ${meta.endpoint}`,
          device: getLogDevice(),
        });
      }

      onHeaders(res, function () {
        meta.headers();
      });

      onFinished(res, function () {
        meta.finish();

        if (options.log) {
          const misc: Record<string, unknown> = {
            size: meta.size,
          };

          if (req.query) misc.query = req.query;
          if (req.params) misc.params = req.params;

          if (meta.status === 500) {
            misc.body = req.body;
            misc.response = meta.responseBody;
          }

          const level: sigmate.Log.Level =
            meta.error instanceof ServerError ? meta.error.logLevel : 'http';

          logger.log({
            level,
            source: 'Request',
            event: 'REQ/FINISH',
            name: `${meta.method} ${meta.endpoint}`,
            status: meta.status,
            duration: meta.duration,
            user: getLogUser(),
            device: getLogDevice(),
            error: meta.error,
            misc,
          });
        }
      });

      next();
    };
  };

  private static createLogUserGetter = (
    req: Request
  ): NonNullable<Request['getLogUser']> => {
    return () =>
      req.user
        ? {
            id: req.user.id ? String(req.user.id) : '',
            userName: req.user.userName ? String(req.user.userName) : '',
          }
        : undefined;
  };

  private static createLogDeviceGetter = (
    req: Request
  ): NonNullable<Request['getLogDevice']> => {
    const device = req.device;
    const meta = req.meta;
    return () =>
      device
        ? {
            ip: device.ip,
            ua: device.ua,
            os: meta?.success ? device.os : device.fullOs,
            browser: meta?.success ? device.browser : device.fullBrowser,
            model: device.model,
            type: device.type,
          }
        : undefined;
  };

  private static createMetadataBuilder = (
    meta: RequestMetadata,
    req: Request,
    res: Response
  ) => {
    return (count = 0) => ({
      id: meta.id,
      requestedAt: meta.requestedAt.toISO(),
      pg: req.pg
        ? {
            limit: req.pg.limit,
            offset: req.pg.offset,
            count,
            page: req.pg.page
              ? {
                  current: req.pg.page || null,
                  total: Math.ceil(count / req.pg.limit),
                }
              : {
                  current: null,
                  total: null,
                },
          }
        : null,
      error: res.error || null,
    });
  };

  /**
   * Middleware to handle requests with pagination queries
   */
  public static pg(
    options: {
      /** Set to validate pagination query string values. Defaults to `true` */
      validate?: boolean;
      /** Validator checks will check for numbers that are within MYSQL type limits. Defaults to `INT`. Possible values are: `INT`, `UINT` and `BIGINT` */
      type?: 'INT' | 'UINT' | 'BIGINT';
    } = {}
  ): RequestHandler[] {
    const middlewares: RequestHandler[] = [];

    const { validate = true, type = 'INT' } = options;

    // Validate the pagination request
    if (validate) {
      const max = MySqlValidators.LIMITS[type].max;
      middlewares.concat([
        query('limit')
          .optional()
          .isInt({ min: 1, max })
          .withMessage('OUT_OF_RANGE')
          .toInt(),
        query('offset')
          .optional()
          .isInt({ min: 0, max })
          .withMessage('OUT_OF_RANGE')
          .toInt(),
        query('page')
          .optional()
          .isInt({ min: 1, max })
          .withMessage('OUT_OF_RANGE')
          .toInt(),
      ]);
    }

    // Parse pagination from query string
    const handlePg: sigmate.ReqHandler<{ pg: true }> = (req, res, next) => {
      const { limit = this.PG_DEFAULTS.limit, offset, page } = req.query;
      let pg: sigmate.ReqPg;
      if (offset) {
        pg = {
          limit,
          offset,
          // Offset take priority over page
          page: undefined,
        };
      } else if (page) {
        // Calculate offset from the page value
        pg = {
          limit,
          offset: (page - 1) * limit,
          page,
        };
      } else {
        // If none is set, use default values
        pg = this.PG_DEFAULTS;
      }
      req.pg = pg;
      next();
    };
    middlewares.push(handlePg);

    return middlewares;
  }

  /** Default values to use when optional pagination query values are not provided */
  private static PG_DEFAULTS: Required<sigmate.ReqPg> = {
    limit: 50,
    offset: 0,
    page: 1,
  };
}
