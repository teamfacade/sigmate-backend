import express from 'express';
import { redirectGoogleOauth } from '../../services/controllers/oauth/google';

const googleRouter = express.Router();

googleRouter.get('/', redirectGoogleOauth);

export default googleRouter;
