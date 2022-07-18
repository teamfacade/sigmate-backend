import express from 'express';
import authRouter from './auth';
import userRouter from './user';

const v1Router = express.Router();

v1Router.use('/auth', authRouter);
v1Router.use('/user', userRouter);

export default v1Router;
