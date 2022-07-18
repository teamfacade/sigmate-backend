import * as path from 'path';
import express, { Express } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import passport from 'passport';
import expressConfig from '../config/express';

const setupExpress = (app: Express) => {
  // Config
  const config = expressConfig[process.env.NODE_ENV];
  app.set('port', process.env.PORT);

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  app.use(cors({ origin: config.corsOrigin }));
  app.use('/', express.static(path.join(__dirname, config.staticFilesRoot)));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(passport.initialize());
};

export default setupExpress;
