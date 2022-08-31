import express from 'express';
import {
  isAuthenticated,
  isRefreshTokenValid,
} from '../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import {
  validateGoogleAuthCode,
  validateMetaMaskAuth,
  validateRenewAccessToken,
} from '../../../middlewares/validators/auth';
import { handleGoogleOauth } from '../../../services/auth/google';
import {
  renewAccessTokenController,
  renewRefreshTokenController,
} from '../../../services/auth';
import {
  getUserByMetamaskWalletController,
  metamaskAuthController,
} from '../../../services/auth/metamask';

const authRouter = express.Router();

authRouter.post(
  '/google',
  validateGoogleAuthCode,
  handleBadRequest,
  handleGoogleOauth
);

authRouter.get('/metamask', getUserByMetamaskWalletController);

authRouter.post(
  '/metamask/verify',
  validateMetaMaskAuth,
  handleBadRequest,
  metamaskAuthController
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
  isAuthenticated,
  renewRefreshTokenController
);

export default authRouter;
