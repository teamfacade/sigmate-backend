import { RequestHandler } from 'express';
import GoogleAuth from '../../../../services/auth/Google';
import { UserResponse } from '../../../../services/auth/User';
import { GoogleAuthError } from '../../../../services/errors/GoogleAuthError';

const redirectAuth: RequestHandler = (req, res, next) => {
  try {
    const url = GoogleAuth.authorizationUrl;
    if (!url) throw new GoogleAuthError({ code: 'GOOGLE/NA_AUTH_URL' });
    res.redirect(url);
  } catch (err) {
    next(err);
  }
};

const authenticate: RequestHandler<
  any,
  { user: UserResponse | null; accessToken: string; refreshToken: string },
  { code: string }
> = async (req, res, next) => {
  try {
    const google = new GoogleAuth();
    const { user, accessToken, refreshToken } = await google.authenticate({
      google: { code: req.body.code },
    });

    await user.reload({ scope: 'my' });

    res.status(200).json({
      user: user.toResponse({ type: 'MY' }),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

const googleControllers: Record<string, RequestHandler> = {
  redirectAuth,
  authenticate,
};

export default googleControllers;
