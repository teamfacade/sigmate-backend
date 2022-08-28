import express from 'express';
import { handleGoogleOauth } from '../../../services/controllers/oauth/google';

const authRouter = express.Router();

authRouter.post('/google', handleGoogleOauth);

export default authRouter;
