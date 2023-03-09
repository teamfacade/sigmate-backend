import express from 'express';
import AuthController from '../../../../controllers/auth';
import AuthValidator from '../../../../middlewares/validators/auth';

const authRouter = express.Router();

authRouter
  .route('/google')
  .get(AuthController.getAuthUrl)
  .post(AuthValidator.authGoogle, AuthController.authGoogle);

export default authRouter;
