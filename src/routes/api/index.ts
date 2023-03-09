import express from 'express';
import authRouter from './v2/auth';
import userRouter from './v2/user';

const apiV2Router = express.Router();

apiV2Router.use('/auth', authRouter);
apiV2Router.use('/user', userRouter);

export default apiV2Router;
