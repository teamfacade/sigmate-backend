import express from 'express';
import UserController from '../../../../controllers/user';

const userRouter = express.Router();

userRouter.route('/').get(UserController.getUserInfo);

export default userRouter;
