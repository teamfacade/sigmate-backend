import { NextFunction, Request, Response } from 'express';
import User from '../../../models/User';
import {
  getGoogleProfile,
  getGoogleTokens,
} from '../../../services/auth/google';
import { retrieveTokens } from '../../../services/auth/token';
import {
  createUserGoogle,
  findUserByGoogleId,
} from '../../../services/database/user';
import NotFoundError from '../../../utils/errors/NotFoundError';

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

/**
 * Accepts Google authentication code and makes Google API call to authenticate a new or returning Sigmate user
 */
export const authGoogle = async (
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
    const response: AuthResponse = {} as AuthResponse;
    let status = 200;

    if (user) {
      response.user = user;
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
  } catch (error) {
    return next(error);
  }
};
