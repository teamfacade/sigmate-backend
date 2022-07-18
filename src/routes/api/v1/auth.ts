import express from 'express';
import { authGoogle } from '../../../controllers/api/v1/auth';
import BadRequestHandler from '../../../middlewares/BadRequestHandler';
import { validateGoogleAuthCode } from '../../../services/validators/auth';

const authRouter = express.Router();

authRouter.post(
  '/google',
  validateGoogleAuthCode,
  BadRequestHandler,
  authGoogle
);

export default authRouter;
