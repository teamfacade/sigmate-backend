import { googleAuth } from '../services/auth/google';

export default class AuthController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getAuthUrl: sigmate.ReqHandler = (req, res, next) => {
    res.redirect(googleAuth.authorizationUrl);
  };

  public static authGoogle: sigmate.ReqHandler<sigmate.Api.Auth.Google> =
    async (req, res, next) => {
      try {
        const { code } = req.body;
        const user = await googleAuth.authenticate({ google: { code }, req });
        const tokens = await googleAuth.getTokens({
          user,
          renew: true,
          force: false,
          req,
        });
        res
          .status(200)
          .json({ ...res.meta(), user: user.toResponse(), ...tokens });
      } catch (error) {
        next(error);
      }
    };
}
