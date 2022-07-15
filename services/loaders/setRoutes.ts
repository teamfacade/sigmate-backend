import { Express } from 'express';
import oauthRouter from '../../routes/oauth';
import apiRouter from '../../routes/api';

const setRoutes = (app: Express) => {
  app.use('/oauth', oauthRouter);
  app.use('/api', apiRouter);
};

export default setRoutes;
