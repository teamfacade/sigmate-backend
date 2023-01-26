import { Router } from 'express';
import googleRouter from './google.route';
import tokenRouter from './token.route';

const authRouter = Router();
authRouter.use('/google', googleRouter);
authRouter.use('/token', tokenRouter);

export default authRouter;
