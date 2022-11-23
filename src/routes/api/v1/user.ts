import express from 'express';
import {
  isAuthenticated,
  passportJwtAuth,
} from '../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import handlePagination from '../../../middlewares/handlePagination';
import {
  validateConnectMetaMask,
  validateGetMetaMaskNonce,
} from '../../../middlewares/validators/connect';
import {
  validateUserCheck,
  validateUserPatch,
} from '../../../middlewares/validators/user';
import {
  checkUserController,
  dailyCheckInController,
  deleteUserController,
  getUserController,
  patchUserController,
} from '../../../services/user';
import {
  connectMetaMaskController,
  getMetaMaskNonceController,
} from '../../../services/user/connect';
import { getReferredUsersController } from '../../../services/user/referral';

const userRouter = express.Router();

userRouter.use(passportJwtAuth);

userRouter
  .route('/')
  .get(isAuthenticated, getUserController)
  .patch(
    isAuthenticated,
    validateUserPatch,
    handleBadRequest,
    patchUserController
  )
  .delete(isAuthenticated, deleteUserController);

userRouter
  .route('/referrals')
  .get(handlePagination, getReferredUsersController);

userRouter.get(
  '/check',
  isAuthenticated,
  validateUserCheck,
  handleBadRequest,
  checkUserController
);

userRouter
  .route('/connect/metamask')
  .get(validateGetMetaMaskNonce, handleBadRequest, getMetaMaskNonceController)
  .delete();

userRouter.post(
  '/connect/metamask/verify',
  validateConnectMetaMask,
  handleBadRequest,
  connectMetaMaskController
);

userRouter.post('/daily-check-in', dailyCheckInController);

export default userRouter;
