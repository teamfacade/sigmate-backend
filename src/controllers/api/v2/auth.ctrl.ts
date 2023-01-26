import { RequestHandler } from 'express';
import { Controller } from '../../../utils/RequestUtil';

export default class AuthController {
  // param, body, body, query
  static redirectGoogle: Controller = (req, res, next) => {};
}
