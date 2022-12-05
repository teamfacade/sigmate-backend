import { RequestHandler } from 'express';
import Auth from '../../../../services/auth';
import Token from '../../../../services/auth/Token';

const user: Record<string, RequestHandler> = {
  getMyInfo: async (req, res, next) => {
    try {
      const user = req.user as NonNullable<typeof req.user>;
      if (!user.found) {
        return res.service.send({ status: 403 });
      }
      await user.reload({ options: 'ALL' });
      const token = new Token({ type: 'ACCESS', user });
      const accessToken = await token.getToken();
      res.service.send({
        status: 200,
        json: { user: user.model?.toJSON(), accessToken },
      });
    } catch (err) {
      next(err);
    }
  },
  createUser: async (req, res, next) => {
    try {
      const auth = new Auth();
      const data = await auth.signup();
      res.service.send({ status: 201, json: data });
    } catch (err) {
      res.service.send({ status: 500, json: { success: false } });
      next(err);
    }
  },
};

export default user;
