import express from 'express';
import { query } from 'express-validator';
import userController from '../../../../controllers/api/v2/user';

const userRouter = express.Router();

userRouter
  .route('/')
  .get(
    query('all').optional().isBoolean().bail().toBoolean(),
    userController.getMyInfo
  );

export default userRouter;
