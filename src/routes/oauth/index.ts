import express from 'express';
import googleRouter from './google';

const oauthRouter = express.Router();

oauthRouter.use('/google', googleRouter);

export default oauthRouter;
