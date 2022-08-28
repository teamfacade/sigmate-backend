import express from 'express';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import { validateGoogleAuthCode } from '../../../middlewares/validators/auth';
import { handleGoogleOauth } from '../../../services/controllers/oauth/google';

const authRouter = express.Router();

authRouter.post(
  '/google',
  validateGoogleAuthCode,
  handleBadRequest,
  handleGoogleOauth
);

export default authRouter;
