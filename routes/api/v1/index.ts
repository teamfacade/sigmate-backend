import express from 'express';
import adminRouter from './admin';
import userRouter from './user';
import authRouter from './auth';

const apiV1Router = express.Router();

apiV1Router.use('/user', userRouter);
apiV1Router.use('/admin', adminRouter);
apiV1Router.use('/auth', authRouter);

export default apiV1Router;
