import { Router } from 'express';
import AuthController from '../../../../controllers/api/v2/auth.ctrl';

const googleRouter = Router();

googleRouter
  .route('/auth/google')
  .get(AuthController.redirectGoogle)
  .post(AuthController.loginGoogle);

export default googleRouter;
