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
        meta: res.meta(),
        success: true,
        user: user.toResponse(),
      });
    } catch (error) {
      next(error);
    }
  };

  @AuthGuard({ login: 'required', findOptions: User.FIND_OPTS.myAll })
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
          referredBy: referredByCode,
          agreeTos,
          agreeLegal,
          agreePrivacy,
        } = req.body;

        const user = req.user;
        if (!user) throw new RequestError('REQ/RJ_UNAUTHENTICATED');

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
            referredByCode,
            agreeTos,
            agreeLegal,
            agreePrivacy,
          },
          req,
        });

        res
          .status(200)
          .json({ meta: res.meta(), success: true, user: user.toResponse() });
      } catch (error) {
        next(error);
      }
    };

  /**
   * Check if username and referralCode is valid for use
   */
  public static check: sigmate.ReqHandler<sigmate.Api.User.Check> = async (
    req,
    res,
    next
  ) => {
    try {
      const { userName, referralCode } = req.query;

      let success = true;
      let userNameRes: sigmate.Api.User.Check['response']['userName'] =
        undefined;
      let referralCodeRes: sigmate.Api.User.Check['response']['referralCode'] =
        undefined;

      if (userName !== undefined) {
        const isValid = account.checkUserNamePolicy(userName, false);
        let isAvailable: boolean;
        if (isValid) {
          isAvailable = await account.checkUserNameAvailability({
            userName,
            throws: false,
          });
        } else {
          isAvailable = false;
        }
        isAvailable = isValid && isAvailable;
        userNameRes = { userName, isAvailable };
        success = success ? isAvailable : false;
      }

      if (referralCode !== undefined) {
        const isValid = await account.checkReferralCode({
          referralCode,
          throws: false,
        });
        referralCodeRes = { referralCode, isValid };
        success = success ? isValid : false;
      }

      res.status(success ? 200 : 400).json({
        meta: res.meta(),
        success,
        userName: userNameRes,
        referralCode: referralCodeRes,
      });
    } catch (error) {
      next(error);
    }
  };

  @AuthGuard({ login: 'required' })
  public static deleteAccount: sigmate.ReqHandler = async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) throw new RequestError('REQ/RJ_UNAUTHENTICATED');
      await account.delete({ user });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
