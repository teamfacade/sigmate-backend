import RequestError from '../errors/request';
import { AuthGuard } from '../middlewares/auth';
import User from '../models/User.model';
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

  @AuthGuard({ login: 'required', findOptions: User.FIND_OPTS.my })
  public static connectGoogle: sigmate.ReqHandler<sigmate.Api.Auth.ConnectGoogle> =
    async (req, res, next) => {
      try {
        const user = req.user;
        if (!user) throw new RequestError('REQ/RJ_UNAUTHENTICATED');
        const { code } = req.body;
        await googleAuth.connect({ user, code, req });

        res.status(200).json({
          ...res.meta(),
          user: user.toResponse(),
        });
      } catch (error) {
        next(error);
      }
    };

  @AuthGuard({ login: 'required', findOptions: User.FIND_OPTS.my })
  public static disconnectGoogle: sigmate.ReqHandler<sigmate.Api.Auth.DisconnectGoogle> =
    async (req, res, next) => {
      try {
        const user = req.user as NonNullable<typeof req.user>;
        await googleAuth.disconnect({ user, req });
        res.status(200).json({ ...res.meta() });
      } catch (error) {
        next(error);
      }
    };
}
