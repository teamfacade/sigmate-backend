import express from 'express';
import announcementRouter from './announcement';
import authRouter from './auth';
import forumRouter from './forum';
import profileRouter from './profile';
import testRouter from './test';
import userRouter from './user';

const v1Router = express.Router();

v1Router.use('/user', userRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/profile', profileRouter);
v1Router.use('/forum', forumRouter);
v1Router.use('/test', testRouter);
v1Router.use('/wh', announcementRouter);

export default v1Router;
