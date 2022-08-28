import {
  authorizationUrl,
  getGoogleProfile,
  getGoogleTokens,
} from '../../auth/google';
import { NextFunction, Request, Response } from 'express';
import ApiError from '../../../utils/errors/ApiError';
import NotFoundError from '../../../utils/errors/NotFoundError';
import { createUserGoogle } from '../../database/user';
import User from '../../../models/User';
import { findUserByGoogleId } from '../../database/auth';

export type AuthResponse = {
  success: boolean;
  user: User;
  accessToken?: string;
  refreshToken?: string;
};

export const redirectGoogleOauth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!authorizationUrl) {
    return next(new ApiError('ERR_GOOGLE_OAUTH_AU'));
  }
  res.redirect(authorizationUrl);
};

export const handleGoogleOauth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Call Google APIs
    const { code } = req.body;
    const googleTokens = await getGoogleTokens(code);
    const googleProfile = await getGoogleProfile();

    if (!googleProfile.id) {
      throw new NotFoundError('ERR_GOOGLE_OAUTH');
    }

    // Check if user already exists
    const user = await findUserByGoogleId(googleProfile.id);

    let status = 200;
    const response: AuthResponse = { success: true } as AuthResponse;
    if (user) {
      // returning user (login)
      response.user = user;
    } else {
      // new user (sign up)
      response.user = await createUserGoogle(googleTokens, googleProfile);
      status = 201;
    }

    response.accessToken = response.user.userAuth?.sigmateAccessToken;
    response.refreshToken = response.user.userAuth?.sigmateRefreshToken;

    // Do not send raw UserAuth object back to client
    if (response.user.userAuth) {
      delete response.user.userAuth;
    }

    res.status(status).json(response);
  } catch (error) {
    return next(error);
  }
};
