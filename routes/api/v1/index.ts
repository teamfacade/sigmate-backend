import express from 'express';
import userRouter from './user';

const apiV1Router = express.Router();

apiV1Router.use('/user', userRouter);

export default apiV1Router;
