import express from 'express';
import passport from 'passport';
import { patchUser } from '../../../controllers/api/v1/users';
import { isMyselfParams } from '../../../middlewares/authMiddlewares';
import pickModelProperties from '../../../middlewares/pickModelProperties';
import User from '../../../models/User';
import { validateUserPatch } from '../../../services/validators/user';

const userRouter = express.Router();

userRouter.use(passport.authenticate('jwt', { session: false }));

userRouter.patch(
  '/:userId',
  isMyselfParams,
  pickModelProperties(User),
  validateUserPatch,
  patchUser
);

export default userRouter;
