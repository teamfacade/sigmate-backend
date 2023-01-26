import { Router } from 'express';
import authRouter from './auth';

const v2Router = Router();

v2Router.use('/auth', authRouter);

export default v2Router;
