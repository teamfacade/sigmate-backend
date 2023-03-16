import { query } from 'express-validator';
import { Request, Response, RequestHandler } from 'express';
import onFinished from 'on-finished';
import onHeaders from 'on-headers';
import { logger } from '../services/logger';
import ClientDevice from '../utils/device';
import ServerError from '../errors';
import BaseValidator from './validators';
import RequestMetadata from '../utils/request';

export default class RequestMw {
  public static device = (): RequestHandler => {
    return (req, res, next) => {
      req.device = new ClientDevice({ req });
      next();
    };
  };

  public static metadata = (): RequestHandler => (req, res, next) => {
    const meta = new RequestMetadata(req, res);
    req.meta = meta;
    res.meta = this.createMetadataBuilder(meta, req, res);

    onHeaders(res, function () {
      meta.headers();
    });

    next();
  };

  public static logger = (): RequestHandler => (req, res, next) => {
    const getLogUser = this.createLogUserGetter(req);
    const getLogDevice = this.createLogDeviceGetter(req);
    req.getLogUser = getLogUser;
    req.getLogDevice = getLogDevice;
    const meta = req.meta;
    if (!meta) return next();

    const oldJson = res.json.bind(res);
    res.json = function (body: any) {
      res.body = body;
      return oldJson(body);
    };

    // Log request start
    logger.log({
      level: 'debug',
      source: 'Request',
      event: 'REQ/START',
      name: `${meta.method} ${meta.endpoint}`,
      device: getLogDevice(),
      id: meta.id,
    });

    onFinished(res, function () {
      const misc: Record<string, unknown> = {};
      if (req.query && Object.keys(req.query).length > 0)
        misc.query = req.query;
      if (req.params && Object.keys(req.params).length > 0)
        misc.params = req.params;

      if (meta.status === 500) {
        misc.body = req.body;
        misc.response = res.body;
      }

      const level: sigmate.Log.Level =
        meta.error instanceof ServerError ? meta.error.logLevel : 'http';

      // Log request finish
      logger.log({
        level,
        source: 'Request',
        event: 'REQ/FINISH',
        name: `${meta.method} ${meta.endpoint}`,
        status: meta.status,
        duration: meta.duration,
        id: meta.id,
        size: meta.size,
        user: getLogUser(),
        device: getLogDevice(),
        error: meta.error,
        misc,
      });
    });

    next();
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
    return () =>
      device
        ? {
            ip: device.ip,
            ua: device.ua,
            os: device.os,
            browser: device.browser,
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
      const max = BaseValidator.MYSQL_LIMITS[type].max;
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
