import express from 'express';
import {
  deleteUserController,
  getUserController,
  patchUserController,
} from '../../../controllers/api/v1/users';
import { passportJwtAuth } from '../../../middlewares/authMiddlewares';
import pickModelProperties from '../../../middlewares/pickModelProperties';
import User from '../../../models/User';
import { validateUserPatch } from '../../../middlewares/validators/user';
import BadRequestHandler from '../../../middlewares/BadRequestHandler';

const userRouter = express.Router();

userRouter.use(passportJwtAuth);

userRouter
  .route('/')
  .get(getUserController)
  .patch(
    pickModelProperties(User),
    validateUserPatch,
    BadRequestHandler,
    patchUserController
  )
  .delete(deleteUserController);

export default userRouter;
