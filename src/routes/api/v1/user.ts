import express from 'express';
import { patchUser } from '../../../controllers/api/v1/users';
import {
  isMyselfParams,
  passportJwtAuth,
} from '../../../middlewares/authMiddlewares';
import pickModelProperties from '../../../middlewares/pickModelProperties';
import User from '../../../models/User';
import { validateUserPatch } from '../../../services/validators/user';

const userRouter = express.Router();

userRouter.use(passportJwtAuth);

userRouter.patch(
  '/:userId',
  isMyselfParams,
  pickModelProperties(User),
  validateUserPatch,
  patchUser
);

export default userRouter;
