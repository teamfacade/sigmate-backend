import { NextFunction, Request, Response } from 'express';
import User from '../../../models/User';
import {
  getGoogleProfile,
  getGoogleTokens,
} from '../../../services/auth/google';
import {
  renewAccessToken,
  renewRefreshToken,
  retrieveTokens,
} from '../../../services/auth/token';
import {
  createUserGoogle,
  findUserByGoogleId,
  updateLastLoggedIn,
} from '../../../services/database/user';
import ForbiddenError from '../../../utils/errors/ForbiddenError';
import NotFoundError from '../../../utils/errors/NotFoundError';

export type AuthResponse = {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
};

/**
 * Accepts Google authentication code and makes Google API call to authenticate a new or returning Sigmate user
 */
export const authGoogleController = async (
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

    // Prepare API response
    const response: AuthResponse = { success: true } as AuthResponse;
    let status = 200;

    let updateLastLoggedInPromise = null;
    if (user) {
      response.user = user;
      updateLastLoggedInPromise = updateLastLoggedIn(user.userId);
    } else {
      // Create user from Google profile information if not exists
      response.user = await createUserGoogle(googleTokens, googleProfile);
      status = 201;
    }

    // Retrieve Sigmate tokens
    const sigmateTokens = await retrieveTokens(
      response.user.userId,
      response.user.group,
      response.user.isAdmin
    );

    response.accessToken = sigmateTokens.accessToken;
    response.refreshToken = sigmateTokens.refreshToken;

    // API response
    res.status(status).json(response);

    // Await remaining promises
    if (updateLastLoggedInPromise) await updateLastLoggedInPromise;
  } catch (error) {
    return next(error);
  }
};

type TokenResponse = {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
};

/**
 * Renew Sigmate access token with a valid refresh token
 * Must be followed by isRefreshTokenValid middleware to work properly
 */
export const renewAccessTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || !req.user.userId)
      throw new ForbiddenError(
        'Error: Cannot renew access token -- req.user not set. Forgot to run isRefreshTokenValid middleware?',
        { clientMessage: 'ERR_TOK' }
      );

    const accessToken = await renewAccessToken(
      req.user.userId,
      req.user.group,
      req.user.isAdmin
    );

    const response: TokenResponse = {
      success: true,
      accessToken,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Renew the refresh and access token.
 * Equivalent to logout of all sessions except the current one, since all the access and refresh tokens stored everywhere else will become invalid
 * Must be followed by passport jwt auth middleware.
 */
export const renewRefreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || !req.user.userId)
      throw new ForbiddenError(
        'Error: Cannot renew access token -- req.user not set. Forgot to run passport auth middleware?',
        { clientMessage: 'ERR_TOK' }
      );

    const refreshToken = await renewRefreshToken(
      req.user.userId,
      req.user.group,
      req.user.isAdmin
    );

    const accessToken = await renewAccessToken(
      req.user.userId,
      req.user.group,
      req.user.isAdmin
    );

    const response: TokenResponse = {
      success: true,
      accessToken,
      refreshToken,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
