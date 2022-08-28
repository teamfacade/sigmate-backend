/**
 * Set all routers for Expres
 */
import { Express } from 'express';
import apiRouter from '../routes/api';

const setupRoutes = (app: Express) => {
  app.use('/api', apiRouter);
};

export default setupRoutes;
