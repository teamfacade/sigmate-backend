import express from 'express';
import UserController from '../../../../controllers/user';
import UserValidator from '../../../../middlewares/validators/user';

const userRouter = express.Router();

userRouter
  .route('/')
  .get(UserController.getMyInfo)
  .patch(UserValidator.updateMyInfo, UserController.updateMyInfo)
  .delete(UserController.deleteAccount);

userRouter.get('/check', UserValidator.check, UserController.check);

export default userRouter;
