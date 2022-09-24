/**
 * Set all routers for Expres
 */
import { Express } from 'express';
import apiRouter from '../routes/api';
import awsRouter from '../routes/aws';
import oauthRouter from '../routes/oauth';

const setupRoutes = (app: Express) => {
  app.use('/api', apiRouter);
  app.use('/oauth', oauthRouter);
  app.use('/aws', awsRouter);
};

export default setupRoutes;
