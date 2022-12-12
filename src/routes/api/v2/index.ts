import express from 'express';
import userRouter from './user';

const v2Router = express.Router();
v2Router.use('/user', userRouter);

export default v2Router;
