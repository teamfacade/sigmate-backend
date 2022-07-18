import express from 'express';
import {
  authGoogleController,
  logoutAllController,
  logoutController,
  renewAccessTokenController,
  renewRefreshTokenController,
} from '../../../controllers/api/v1/auth';
import {
  isRefreshTokenValid,
  passportJwtAuth,
} from '../../../middlewares/authMiddlewares';
import BadRequestHandler from '../../../middlewares/BadRequestHandler';
import {
  validateGoogleAuthCode,
  validateRenewAccessToken,
} from '../../../services/validators/auth';

const authRouter = express.Router();

authRouter.post(
  '/google',
  validateGoogleAuthCode,
  BadRequestHandler,
  authGoogleController
);

authRouter.post(
  '/token/renew/access',
  validateRenewAccessToken,
  isRefreshTokenValid,
  renewAccessTokenController
);

authRouter.get(
  '/token/renew/refresh',
  passportJwtAuth,
  renewRefreshTokenController
);

authRouter.get('/logout', passportJwtAuth, logoutController);
authRouter.get('/logout/all', passportJwtAuth, logoutAllController);

export default authRouter;
