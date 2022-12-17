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

export default authRouter;
