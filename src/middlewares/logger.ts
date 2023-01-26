import { RequestHandler } from 'express';
import onHeaders from 'on-headers';
import onFinished from 'on-finished';
import { logger } from '../services/logger/LoggerService';
import RequestUtil from '../utils/RequestUtil';

export default class LoggerMiddleware {
  static mw(event: 'request') {
    switch (event) {
      case 'request':
        return this.request;
      default:
        throw new Error('Middleware not found');
    }
  }

  static request: RequestHandler = (req, res, next) => {
    // Log request start
    const reqUtil = new RequestUtil(req);
    req.util = reqUtil;
    logger.log({ request: req });

    // Log request end
    onHeaders(res, function () {
      reqUtil.onHeaders();
    });

    onFinished(req, function (err, req) {
      reqUtil.onFinished();
      if (err) reqUtil.logger.success = false;
      logger.log({ request: req, error: err || undefined });
    });

    next();
  };
}
