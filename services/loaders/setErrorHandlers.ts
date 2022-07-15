import { Express } from 'express';
import apiErrorHandler from '../../middlewares/apiErrorHandler';
import errorHandler from '../../middlewares/errorHandler';
import errorLogger from '../../middlewares/errorLogger';

const setErrorHandlers = (app: Express) => {
  app.use(errorLogger);
  app.use(apiErrorHandler);
  app.use(errorHandler);
};

export default setErrorHandlers;
