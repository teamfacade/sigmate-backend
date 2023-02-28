import BaseController from '../..';
import {
  Controller,
  RequireAuth,
  Validator,
} from '../../../decorators/controllers';
import AuthValidator from '../../../middlewares/validators/express/auth';
import { UserResponse } from '../../../models/user/User.model';
import { googleAuth } from '../../../services/auth/GoogleAuthService';
import { TokenObj } from '../../../services/auth/TokenAuthService';
import GoogleAuthError from '../../../services/errors/GoogleAuthError';
import { EController } from '../../../utils/RequestUtil';

export default class AuthController extends BaseController {
  @Controller
  static redirectGoogle: EController = (req, res) => {
    const url = googleAuth.authorizationUrl;
    if (!url) {
      throw new GoogleAuthError({ code: 'GOOGLE/NF_URL' });
    }
    res.redirect(url);
  };

  @RequireAuth
  @Validator(AuthValidator, { body: { code: 'googleOAuthCode' } })
  @Controller
  static loginGoogle: EController<{
    body: { code: string };
    response: { user: UserResponse; tokens: TokenObj };
  }> = async (req, res) => {
    const { code } = req.body;
    const { created, user, tokens } = await googleAuth.authenticate({
      code,
      req,
    });
    res.status(created ? 201 : 200).json({
      user: user.formatResponse({ sensitive: true }) as UserResponse,
      tokens,
    });
  };

  @RequireAuth
  @Validator(AuthValidator, { body: { code: 'googleOAuthCode' } })
  @Controller
  static connectGoogle: EController<{
    body: { code: string };
    response: { success: boolean };
  }> = async (req, res) => {
    const { code } = req.body;
    await googleAuth.connect({ code, req });
    res.status(200).json({ success: true });
  };

  @RequireAuth
  @Controller
  static disconnectGoogle: EController<{ response: { success: boolean } }> =
    async (req, res) => {
      await googleAuth.disconnect({ req, user: req.user });
      res.status(200).json({ success: true });
    };
}
