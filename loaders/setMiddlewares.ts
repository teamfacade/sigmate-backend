import express, { Express } from 'express';
import morgan from 'morgan';
import path from 'path';
import { getNodeEnv } from '../config';
import initConfig, { InitConfig } from '../config/initConfig';

const env = getNodeEnv();
const config: InitConfig = initConfig[env];

const setMiddlewares = (app: Express) => {
  // Dev only
  if (env === 'development') {
    app.use(morgan('dev'));
  }

  // Common
  app.use('/', express.static(path.join(__dirname, config.staticRoot)));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
};

export default setMiddlewares;
