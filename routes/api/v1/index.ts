import express from 'express';
import adminRouter from './admin';
import userRouter from './user';

const apiV1Router = express.Router();

apiV1Router.use('/user', userRouter);
apiV1Router.use('/admin', adminRouter);

export default apiV1Router;
