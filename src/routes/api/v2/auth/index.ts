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

authRouter.get(
  '/metamask',
  AuthValidator.getMetamaskNonce,
  AuthController.getMetamaskNonce
);
authRouter.post(
  '/metamask/verify',
  AuthValidator.authMetamask,
  AuthController.authMetamask
);

authRouter.get(
  '/metamask/connect',
  AuthValidator.getMetamaskNonce,
  AuthController.connectMetamaskGetNonce
);
authRouter.post(
  '/metamask/connect/verify',
  AuthValidator.authMetamask,
  AuthController.connectMetamaskVerify
);

authRouter
  .route('/twitter')
  .get(AuthController.getTwitterAuthUrl)
  .post(AuthValidator.authTwitter, AuthController.authTwitter);

export default authRouter;
