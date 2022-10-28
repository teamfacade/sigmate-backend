import express from 'express';
import {
  isAuthenticated,
  passportJwtAuth,
} from '../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../middlewares/handleBadRequest';
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
  deleteUserController,
  getUserController,
  patchUserController,
} from '../../../services/user';
import {
  connectMetaMaskController,
  getMetaMaskNonceController,
} from '../../../services/user/connect';

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

export default userRouter;
