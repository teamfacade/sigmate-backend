import express from 'express';
import {
  deleteUserController,
  patchUserController,
} from '../../../controllers/api/v1/users';
import {
  isMyselfParams,
  passportJwtAuth,
} from '../../../middlewares/authMiddlewares';
import pickModelProperties from '../../../middlewares/pickModelProperties';
import User from '../../../models/User';
import {
  validateUserDelete,
  validateUserPatch,
} from '../../../services/validators/user';

const userRouter = express.Router();

userRouter.use(passportJwtAuth);

userRouter
  .route('/:userId')
  .patch(
    isMyselfParams,
    pickModelProperties(User),
    validateUserPatch,
    patchUserController
  )
  .delete(isMyselfParams, validateUserDelete, deleteUserController);

export default userRouter;
