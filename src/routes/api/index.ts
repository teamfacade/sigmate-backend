import express from 'express';
import authRouter from './v2/auth';
import userRouter from './v2/user';
import wikiRouter from './v2/wiki';

const apiV2Router = express.Router();

apiV2Router.use('/auth', authRouter);
apiV2Router.use('/user', userRouter);
apiV2Router.use('/wiki', wikiRouter);

export default apiV2Router;
