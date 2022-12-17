import { RequestHandler } from 'express';
import { UserResponse } from '../../../../services/auth/User';

const getMyInfo: RequestHandler<
  any,
  {
    user: UserResponse | null;
  },
  any,
  {
    all?: boolean;
  }
> = async (req, res, next) => {
  try {
    const user = req.user as NonNullable<typeof req.user>;
    // Load "slow" columns only when necessary
    const loadAll = req.query.all || false;
    await user.reload({ scope: loadAll ? 'myFull' : 'my' });
    res.status(200).json({ user: user.toResponse({ type: 'MY' }) });
  } catch (err) {
    next(err);
  }
};

const userController: Record<string, RequestHandler> = {
  getMyInfo,
};

export default userController;
