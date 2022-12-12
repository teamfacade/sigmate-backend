import { RequestHandler } from 'express';
import Token from '../../../../services/auth/Token';

type RenewAccessReqBody = {
  refreshToken?: string;
};

type RenewAccessResBody = {
  accessToken: string;
};

const renewAccess: RequestHandler<
  any,
  RenewAccessResBody,
  RenewAccessReqBody
> = async (req, res, next) => {
  try {
    const token = new Token({ type: 'ACCESS', user: req.user });
    await token.verify({ expect: 'REFRESH', token: req.body.refreshToken });
    res.status(200).json({
      accessToken: await token.getToken({ renew: true }),
    });
  } catch (err) {
    next(err);
  }
};

const tokenController: Record<string, RequestHandler> = {
  renewAccess,
};

export default tokenController;
