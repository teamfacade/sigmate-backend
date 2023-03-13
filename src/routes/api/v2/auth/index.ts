import express from 'express';
import AuthController from '../../../../controllers/auth';
import AuthValidator from '../../../../middlewares/validators/auth';

const authRouter = express.Router();

authRouter
  .route('/token/renew/access')
  .post(AuthValidator.renewAccess, AuthController.renewAccess);

authRouter
  .route('/google')
  .get(AuthController.getAuthUrl)
  .post(AuthValidator.authGoogle, AuthController.authGoogle);

authRouter
  .route('/google/connect')
  .get(AuthController.getAuthUrl)
  .post(AuthValidator.authGoogle, AuthController.connectGoogle);

authRouter.route('/google/disconnect').post(AuthController.disconnectGoogle);

export default authRouter;
