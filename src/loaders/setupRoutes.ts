/**
 * Set all routers for Expres
 */
import { Express } from 'express';
import apiRouter from '../routes/api';
import oauthRouter from '../routes/oauth';

const setupRoutes = (app: Express) => {
  app.use('/api', apiRouter);
  app.use('/oauth', oauthRouter);
};

export default setupRoutes;
