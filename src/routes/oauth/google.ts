import express from 'express';
import { redirectGoogleOauth } from '../../services/auth/google';

const googleRouter = express.Router();

googleRouter.get('/', redirectGoogleOauth);

export default googleRouter;
