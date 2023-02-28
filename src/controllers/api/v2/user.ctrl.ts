import BaseController from '../..';
import { Controller, RequireAuth } from '../../../decorators/controllers';
import { EController } from '../../../utils/RequestUtil';

export default class UserController extends BaseController {
  @RequireAuth
  @Controller
  static getUserInfo: EController = async (req, res) => {
    //
  };
}
