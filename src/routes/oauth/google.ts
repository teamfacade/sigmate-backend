import express from 'express';
import redirectGoogleOauth from '../../controllers/oauth/google';

const googleOauthRouter = express.Router();

googleOauthRouter.get('/', redirectGoogleOauth);

export default googleOauthRouter;
