import express from 'express';
import authRouter from './auth';
import userRouter from './user';

const v2Router = express.Router();
v2Router.use('/user', userRouter);
v2Router.use('/auth', authRouter);

export default v2Router;
