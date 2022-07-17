import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  getGoogleProfile,
  getGoogleTokens,
  updateGoogleTokens,
} from '../../../services/auth/google';
import { findUserByGoogleId } from '../../../services/user/findUser';
import InvalidRequestError from '../../../utilities/errors/InvalidRequestError';
import { createUserGoogle } from '../../../services/user/createUser';
import User from '../../../models/user/User';
import { retrieveTokens } from '../../../services/auth/token';
import { ApiResponse } from '..';

const authRouter = express.Router();

interface LoginResponse extends ApiResponse {
  user: User | null;
  accessToken: string;
  refreshToken: string;
}

authRouter.post(
  '/google',
  body('code').notEmpty().withMessage('ERR_REQUIRED'),
  async (req, res, next) => {
    // Handle invalid requests
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new InvalidRequestError(errors.array()));
    }

    try {
      // Obtain profile information from Google APIs
      const { code } = req.body;
      const googleTokens = await getGoogleTokens(code);
      const googleProfile = await getGoogleProfile();

      // Create user if not alredy exists
      const exUser = await findUserByGoogleId(googleProfile.id);

      // Prepare API response
      const response: LoginResponse = {
        success: true,
        user: null,
        accessToken: '',
        refreshToken: '',
      };

      if (exUser) {
        // Existing user
        response.user = exUser;
        await updateGoogleTokens(exUser.userId, googleTokens);
      } else {
        // New user
        const newUser = await createUserGoogle(googleTokens, googleProfile);
        response.user = newUser;
      }

      const sigmateTokens = await retrieveTokens(
        response.user.userId,
        response.user.group,
        response.user.isAdmin
      );
      response.accessToken = sigmateTokens.accessToken;
      response.refreshToken = sigmateTokens.refreshToken;

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default authRouter;
