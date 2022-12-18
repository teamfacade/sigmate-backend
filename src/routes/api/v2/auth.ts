import express from 'express';
import authController from '../../../controllers/api/v2/auth';
import Auth from '../../../services/auth';

const authRouter = express.Router();

authRouter
  .route('/google')
  .get(authController.google.redirectAuth)
  .post(
    Auth.validate({
      location: 'body',
      fields: ['code'],
    }),
    authController.google.authenticate
  );

authRouter
  .route('/metamask')
  .get(
    Auth.validate({
      location: 'body',
      fields: ['nonce'],
    }),
    authController.metamask.getNonce
  )
  .post(
    Auth.validate({
      location: 'body',
      fields: ['walletAddress', 'signature'],
    }),
    authController.metamask.verfiy
  );

export default authRouter;
