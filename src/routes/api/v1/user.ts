import express from 'express';
import {
  isAuthenticated,
  passportJwtAuth,
} from '../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../middlewares/handleBadRequest';
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

export default userRouter;
