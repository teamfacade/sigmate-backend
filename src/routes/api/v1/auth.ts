import express from 'express';
import {
  isRefreshTokenValid,
  passportJwtAuth,
} from '../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import {
  validateGoogleAuthCode,
  validateRenewAccessToken,
} from '../../../middlewares/validators/auth';
import { handleGoogleOauth } from '../../../services/auth/google';
import {
  renewAccessTokenController,
  renewRefreshTokenController,
} from '../../../services/auth';

const authRouter = express.Router();

authRouter.post(
  '/google',
  validateGoogleAuthCode,
  handleBadRequest,
  handleGoogleOauth
);

authRouter.post(
  '/token/renew/access',
  validateRenewAccessToken,
  handleBadRequest,
  isRefreshTokenValid,
  renewAccessTokenController
);

authRouter.post(
  '/token/renew/refresh',
  passportJwtAuth,
  renewRefreshTokenController
);

export default authRouter;
