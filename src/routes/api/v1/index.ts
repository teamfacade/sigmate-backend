import express from 'express';
import authRouter from './auth';
import profileRouter from './profile';
import userRouter from './user';

const v1Router = express.Router();

v1Router.use('/user', userRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/profile', profileRouter);

export default v1Router;
