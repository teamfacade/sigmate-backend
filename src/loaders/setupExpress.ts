import * as path from 'path';
import express, { Express } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import passport from 'passport';
import expressConfig from '../config/express';
import jwtStrategy from '../services/passport/jwt';
import getUserDevice from '../middlewares/getUserDevice';

const setupExpress = (app: Express) => {
  // Config
  const config = expressConfig[process.env.NODE_ENV];
  app.set('port', process.env.PORT);

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  app.use(cors());
  app.use('/', express.static(path.join(__dirname, config.staticFilesRoot)));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  passport.use(jwtStrategy);
  app.use(passport.initialize());

  // Collect information about user's connection
  app.use(getUserDevice);
};

export default setupExpress;
