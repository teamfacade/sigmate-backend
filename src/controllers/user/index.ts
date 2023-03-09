import RequestError from '../../errors/request';
import { AuthGuard } from '../../middlewares/auth';
import User from '../../models/User.model';

export default class UserController {
  @AuthGuard({ login: 'required' })
  public static getUserInfo: sigmate.ReqHandler<{
    query: { all?: string };
    response: { user: sigmate.Api.User.UserResponse };
  }> = async (req, res, next) => {
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
}
