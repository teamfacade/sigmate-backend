import express from 'express';
import { authorizationUrl } from '../services/auth/google';
import ApiError from '../utilities/errors/ApiError';

const oauthRouter = express.Router();

oauthRouter.use('/google', (req, res, next) => {
  if (!authorizationUrl) {
    // TODO Google login fail: Authorization url not initialized
    return next(new ApiError('ERR_GOOGLE_OAUTH'));
  }
  res.redirect(authorizationUrl);
});

export default oauthRouter;
