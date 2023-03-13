import RequestError from '../../errors/request';
import { AuthGuard } from '../../middlewares/auth';
import User from '../../models/User.model';
import { account } from '../../services/account';

export default class UserController {
  @AuthGuard({ login: 'required' })
  public static getMyInfo: sigmate.ReqHandler<sigmate.Api.User.GetMyInfo> = async (
    req,
    res,
    next
  ) => {
    try {
      const { all } = req.query;
      const user = req.user;
      if (!user) throw new RequestError('REQ/RJ_UNAUTHENTICATED');
      await user.reload(all ? User.FIND_OPTS.myAll : User.FIND_OPTS.my);
      res.status(200).json({
        ...res.meta(),
        user: user.toResponse(),
      });
    } catch (error) {
      next(error);
    }
  };

  @AuthGuard({ login: 'required' })
  public static updateMyInfo: sigmate.ReqHandler<sigmate.Api.User.UpdateMyInfo> =
    async (req, res, next) => {
      try {
        const {
          userName,
          fullName,
          bio,
          email,
          isGooglePublic,
          isTwitterPublic,
          isDiscordPublic,
          isMetamaskPublic,
          locale,
          agreeTos,
          agreeLegal,
          agreePrivacy,
        } = req.body;

        const user = req.user;
        if (!user) throw new RequestError('REQ/RJ_UNAUTHENTICATED');
        await user.reload(User.FIND_OPTS.myAll);
        await account.update({
          user,
          attribs: {
            userName,
            fullName,
            bio,
            email,
            isGooglePublic,
            isTwitterPublic,
            isDiscordPublic,
            isMetamaskPublic,
            locale,
            agreeTos,
            agreeLegal,
            agreePrivacy,
          },
          req,
        });
        res.status(200).json({ ...res.meta(), user: user.toResponse() });
      } catch (error) {
        next(error);
      }
    };
}
