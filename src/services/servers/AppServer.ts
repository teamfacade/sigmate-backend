import dotenv from 'dotenv';
dotenv.config();

import { Server as HttpServer } from 'http';
import express, { Express } from 'express';
import cors from 'cors';
import passport from 'passport';
import ServerError from '../errors/ServerError';
import Server from './Server';
import requestIp from 'request-ip';
import { isEnv, isEnvVarSet, waitTimeout } from '../../utils';
import Logger from '../logger';
import { ServerStatus } from '../../utils/status';
import Database from '../Database';
import RequestService from '../Request';
import v2Router from '../../routes/api/v2';
import awsRouter from '../../routes/aws';
import Token from '../auth/Token';
import GoogleAuth from '../auth/Google';
import Service from '../Service';
import Action from '../Action';
import authMw from '../../middlewares/auth';
import errorMw from '../../middlewares/errors';
import serviceMw from '../../middlewares/request';
import Auth from '../auth';
import Midas from '../reward/Midas';

export default class AppServer extends Server {
  name = 'APP';
  server?: HttpServer;
  app: Express = undefined as unknown as Express;
  logger: Logger;
  db: Database;
  auth?: any;
  /**
   * Exit code to use when calling `process.exit(exitCode)`
   * 0: Graceful shutdown
   * 1: Do not restart (TODO)
   */
  exitCode = 0;

  constructor() {
    super();
    if (AppServer.initialized) {
      this.onError({
        message: 'Instance of AppServer already exists.',
      });
    }
    AppServer.initialized = true;
    this.logger = new Logger({ checkStart: false });
    this.db = new Database({ checkStart: false });
  }

  checkEnv() {
    const notSetArray: (string | number)[] = [];

    let ENV = 'DEV';
    switch (process.env.NODE_ENV) {
      case 'test':
        ENV = 'TEST';
        break;
      case 'production':
        ENV = 'PROD';
        break;
      case 'development':
      default:
        ENV = 'DEV';
        break;
    }

    const requiredEnvVars = [
      'NODE_ENV',
      'SERVICE_NAME',
      'PORT',
      'DB_PORT',
      `DB_DATABASE_${ENV}`,
      `DB_USERNAME_${ENV}`,
      `DB_PASSWORD_${ENV}`,
      `DB_HOST_${ENV}`,
      'AWS_BUCKET_NAME',
      'AWS_ACCESS_KEY',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_LOGGER_ACCESS_KEY',
      'AWS_LOGGER_SECRET_ACCESS_KEY',
      'AWS_S3_IMAGE_BASEURL',
      'COOKIE_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'PATH_PUBLIC_KEY',
      'PATH_PRIVATE_KEY',
      'TWITTER_BEARER_TOKEN',
      'LAMBDA_BOT_URL',
    ];

    requiredEnvVars.forEach((envVar) => isEnvVarSet(envVar, { notSetArray }));

    if (notSetArray.length) {
      const varnames = notSetArray.join(', ');
      this.onError({
        message: `Required environment variables not set: ${varnames}`,
      });
    }
  }

  async start() {
    console.log('Server starting...');
    this.status = ServerStatus.STARTING;

    // Start Logger
    try {
      this.logger.start();
      Service.logger = this.logger;
      Action.logger = this.logger;
      Database.logger = this.logger;
      RequestService.logger = this.logger;
    } catch (error) {
      this.onError({ error });
    }
    // TODO Log server starting
    this.logger.log({ server: this });

    // Check Environment Variables
    this.checkEnv();

    // Start Database
    try {
      await this.db.start();
      if (isEnv('development')) {
        await Database.sync({ force: false, seed: false });
      }
    } catch (error) {
      this.onError({ error });
    }

    // Start Request
    RequestService.start();

    // Start Token
    try {
      await new Token({ type: 'ACCESS', checkStart: false }).start();
      passport.use(Token.PASSPORT_STRATEGY_JWT);
    } catch (error) {
      this.onError({ error });
    }

    // Start Auth
    try {
      await Auth.start();
      GoogleAuth.googleStart();
    } catch (error) {
      this.onError({ error });
    }

    Midas.start();

    // Set up middlewares
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api/v2', serviceMw.init);
    app.use('/api/v2', requestIp.mw());
    app.use('/api/v2', passport.initialize());
    app.use('/api/v2', authMw.passportJwt);

    // Setup routers
    app.use('/api/v2', v2Router);
    app.use('/aws', awsRouter);
    // Setup error handling middlewares
    app.use(errorMw.defaultHandler);
    // Start HTTP server
    this.server = app.listen(process.env.PORT || 5100, this.onStart.bind(this));
    this.app = app;
  }

  /**
   * Chores to do after a successful server start
   * - Log the successful server start
   * - (PM2 Cluster Mode) Send a 'ready' signal to the parent process
   *   https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
   */
  onStart(): void {
    this.status = ServerStatus.STARTED;
    RequestService.start();
    if (process.send) process.send('ready');
    this.logger.log({ server: this });
    process.on('SIGINT', this.onSigint.bind(this));
  }

  /**
   * Gracefully shut down the server on SIGINT (Ctrl+C)
   */
  onSigint(): void {
    process.removeAllListeners('SIGINT');
    console.log('SIGINT(^C) received');
    this.close().then(() => {
      process.exit(this.exitCode);
    });
  }

  async close() {
    this.status = ServerStatus.CLOSING;
    this.logger.log({ server: this });
    try {
      // Close Http Server
      if (this.server) {
        const server = this.server;
        const serverClose = new Promise<void>((resolve) => {
          server.on('close', () => {
            resolve();
          });
        });
        server.close();
        await waitTimeout(serverClose, 10000);
      }
      // Close DB
      await this.db.close();
    } catch (error) {
      this.onError({ message: 'Graceful shutdown failed', error });
    }

    try {
      // Close Logger
      await Logger.close();
    } catch (error) {
      if (isEnv('development')) console.error(error);
    }

    this.status = ServerStatus.CLOSED;
    console.log('Server closed.');
  }

  /**
   * Handle critical errors in the server and gracefully shut down
   */
  onError(options: sigmate.Error.HandlerOptions): void {
    const { message, error: cause } = options;

    const error =
      cause instanceof ServerError
        ? cause
        : new ServerError({
            name: 'ServerError',
            label: { source: 'SERVER', name: 'APP' },
            code: 'APP/ER_START',
            level: 'error',
            critical: true,
            error: cause,
            message,
          });

    // Log the error, if possible
    if (this.logger?.started) {
      this.logger.log({ error });
      if (error.critical) {
        this.status = ServerStatus.FAILED;
        this.logger.log({ server: this });
      }
    } else {
      if (isEnv('development')) {
        console.error(error);
        if (error.cause) console.error(error.cause);
        console.log(`SERVER 'APP' failed to start: ${message}`);
      }
    }

    // For critical errors, fail the server and exit process
    // Set non-zero exit code to prevent PM2 restart
    if (error.critical) {
      process.exit(1);
    }
  }
}
