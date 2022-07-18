import { NextFunction, Request, Response } from 'express';
import { authorizationUrl } from '../../services/auth/google';
import ApiError from '../../utils/errors/ApiError';

const redirectGoogleOauth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!authorizationUrl) {
    return next(new ApiError('ERR_GOOGLE_OAUTH'));
  }
  res.redirect(authorizationUrl);
};

export default redirectGoogleOauth;
