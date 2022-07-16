import express from 'express';
import {
  authorizationUrl,
  getGoogleProfile,
  getGoogleTokens,
} from '../../services/auth/google';
import { createUserGoogle } from '../../services/user/createUser';
import { findUserByGoogleId } from '../../services/user/findUser';
import url from 'url';
import ApiError from '../../utilities/errors/ApiError';

const googleOAuthRouter = express.Router();

googleOAuthRouter.get('/', (req, res, next) => {
  if (!authorizationUrl) {
    // TODO Google login fail: Authorization url not initialized
    return next(new ApiError('ERR_GOOGLE_OAUTH'));
  }
  res.redirect(authorizationUrl);
});

googleOAuthRouter.get('/callback', async (req, res, next) => {
  const q = url.parse(req.url, true).query;

  if (q.error) {
    // TODO Google login fail: Redirect to login page
    const errStr = 'Sign in with Google failed with an error: ' + q.error;
    console.error(errStr);
    res.send(errStr);
    return;
  }

  const code = q.code as string;

  try {
    const googleTokens = await getGoogleTokens(code);
    const googleProfile = await getGoogleProfile();

    const exUser = await findUserByGoogleId(googleProfile.id);
    if (exUser) {
      res.json(exUser);
    } else {
      const newUser = await createUserGoogle(googleTokens, googleProfile);
      res.json(newUser);
    }
    // TODO Google login success: Redirect to home page
  } catch (error) {
    next(error);
  }
});

export default googleOAuthRouter;
