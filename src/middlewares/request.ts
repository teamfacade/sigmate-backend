import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import { DateTime } from 'luxon';
import onFinished from 'on-finished';
import RequestService from '../services/Request';

const serviceMw: Record<string, RequestHandler> = {
  init: (req, res, next) => {
    req.service = new RequestService({ req, res });
    onFinished(res, () => {
      req.service.onSend(res);
    });
    next();
  },
  resCapture: (req, res, next) => {
    const oldJson = res.json;
    res.json = (body: Record<string, any>) => {
      const response: Record<string, any> = {
        success: true,
        request: {
          id: req.service.id,
        },
        ...body,
      };

      // For paginated responses
      if (req.service.pagination) {
        const pg = req.service.pagination;
        response.request.limit = pg.limit;
        response.request.offset = pg.offset;
        response.request.page = {
          current: pg.page.current,
          total: pg.page.total,
        };
        response.request.count = pg.count;
        response.queriedAt = DateTime.now().setZone('utc').toISO();
      }

      // Handle Bad Request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        response.success = false;
        response.validationErrors = errors.array();
      }

      // Capture response body to be logged (if necessary)
      if (req.service.response) {
        response.body = body;
      } else {
        req.service.response = {
          status: 200,
          size: 0,
          body: body,
        };
      }

      return oldJson(response);
    };
    next();
  },
};

export default serviceMw;
