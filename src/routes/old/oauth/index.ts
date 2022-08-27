import express from 'express';
import googleOauthRouter from './google';

const oauthRouter = express.Router();

oauthRouter.use('/google', googleOauthRouter);

export default oauthRouter;
