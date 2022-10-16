import express from 'express';
import announcementRouter from './announcement';
import authRouter from './auth';
import calendarRouter from './calendar';
import forumRouter from './forum';
import profileRouter from './profile';
import userRouter from './user';
import wikiRouter from './wiki';
import imageRouter from './image';
import waitingRouter from './waiting';

const v1Router = express.Router();

v1Router.use('/user', userRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/profile', profileRouter);
v1Router.use('/forum', forumRouter);
v1Router.use('/image', imageRouter);
v1Router.use('/wiki', wikiRouter);
v1Router.use('/calendar', calendarRouter);
v1Router.use('/wh', announcementRouter);
v1Router.use('/waiting', waitingRouter);

export default v1Router;
