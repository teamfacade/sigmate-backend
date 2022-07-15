import { Express } from 'express';
import indexRouter from '../routes';
import apiRouter from '../routes/api';

const setRoutes = (app: Express) => {
  app.use('/', indexRouter);
  app.use('/api', apiRouter);
};

export default setRoutes;
