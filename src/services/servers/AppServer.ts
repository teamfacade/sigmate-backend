import dotenv from 'dotenv';
dotenv.config();

import { Server as HttpServer } from 'http';
import express, { Express } from 'express';
import cors from 'cors';
import passport from 'passport';
import ServerError from '../errors/ServerError';
import Server from './Server';
import requestIp from 'request-ip';
import { isEnvVarSet, waitTimeout } from '../../utils';
import Logger from '../logger';
import { ServerStatus } from '../../utils/status';
import Database from '../Database';
import RequestService from '../Request';
import v2Router from '../../routes/api/v2';
import awsRouter from '../../routes/aws';
import Token from '../auth/Token';
import User from '../auth/User';

type ErrorTypes = 'INIT';

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
    ServerError.server = this;
    this.logger = new Logger({ checkStart: false });
    this.db = new Database({ checkStart: false });
  }

  checkEnv() {
    const notSetArray: (string | number)[] = [];
    isEnvVarSet('NODE_ENV', { notSetArray });
    isEnvVarSet('SERVICE_NAME', { notSetArray });
    isEnvVarSet('PORT', { notSetArray });
    isEnvVarSet('DB_PORT', { notSetArray });
    isEnvVarSet('DB_DATABASE_DEV', { notSetArray });
    isEnvVarSet('DB_DATABASE_TEST', { notSetArray });
    isEnvVarSet('DB_DATABASE_PROD', { notSetArray });
    isEnvVarSet('DB_USERNAME_DEV', { notSetArray });
    isEnvVarSet('DB_USERNAME_TEST', { notSetArray });
    isEnvVarSet('DB_USERNAME_PROD', { notSetArray });
    isEnvVarSet('DB_PASSWORD_DEV', { notSetArray });
    isEnvVarSet('DB_PASSWORD_TEST', { notSetArray });
    isEnvVarSet('DB_PASSWORD_PROD', { notSetArray });
    isEnvVarSet('DB_HOST_DEV', { notSetArray });
    isEnvVarSet('DB_HOST_TEST', { notSetArray });
    isEnvVarSet('DB_HOST_PROD', { notSetArray });
    isEnvVarSet('AWS_BUCKET_NAME', { notSetArray });
    isEnvVarSet('AWS_ACCESS_KEY', { notSetArray });
    isEnvVarSet('AWS_SECRET_ACCESS_KEY', { notSetArray });
    isEnvVarSet('AWS_LOGGER_ACCESS_KEY', { notSetArray });
    isEnvVarSet('AWS_LOGGER_SECRET_ACCESS_KEY', { notSetArray });
    isEnvVarSet('AWS_S3_IMAGE_BASEURL', { notSetArray });
    isEnvVarSet('COOKIE_SECRET', { notSetArray });
    isEnvVarSet('GOOGLE_CLIENT_ID', { notSetArray });
    isEnvVarSet('GOOGLE_CLIENT_SECRET', { notSetArray });
    isEnvVarSet('PATH_PUBLIC_KEY', { notSetArray });
    isEnvVarSet('PATH_PRIVATE_KEY', { notSetArray });
    isEnvVarSet('TWITTER_BEARER_TOKEN', { notSetArray });
    isEnvVarSet('LAMBDA_BOT_URL', { notSetArray });

    if (notSetArray.length) {
      const varnames = notSetArray.join(', ');
      this.onError({
        message: `Required environment variables not set: ${varnames}`,
      });
    }
  }

  async start() {
    this.status = ServerStatus.STARTING;
    // Start Logger
    try {
      this.logger.start();
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
      await this.db.sequelize.sync({ force: false, alter: true });
    } catch (error) {
      this.onError({ error });
    }
    try {
      RequestService.start();
    } catch (error) {
      this.onError({ error });
    }
    try {
      new Token({ type: 'ACCESS', checkStart: false }).start();
      passport.use(Token.PASSPORT_STRATEGY_JWT);
    } catch (error) {
      this.onError({ error });
    }
    // Start Auth
    // Set up middlewares
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api/v2', RequestService.mw());
    app.use('/api/v2', requestIp.mw());
    app.use('/api/v2', passport.initialize());
    app.use('/api/v2', (req, res, next) => {
      passport.authenticate('jwt', { session: false }, (err, user) => {
        if (err) return next(err);
        if (user) {
          req.user = user;
        } else {
          req.user = new User();
        }
        next();
      })(req, res, next);
    });

    // TODO setup routers
    app.use('/api/v2', v2Router);
    app.use('/aws', awsRouter);
    // TODO setup error handling middlewares
    // app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    //   res.status(500).json({ success: false });
    // });
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
    // TODO Log server started
    this.logger.log({ server: this });
    process.on('SIGINT', this.onSigint.bind(this));
  }

  onSigint(): void {
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
      console.error(error);
    }
    this.status = ServerStatus.CLOSED;
    console.log('Server closed.');
  }

  /**
   * Handle critical errors in the server and gracefully shut down
   */
  onError(
    options: sigmate.Error.HandlerOptions<ErrorTypes> & {
      needClose?: boolean;
      preventPm2Restart?: boolean;
    }
  ): void {
    const { type = 'OTHER', error: cause } = options;
    // if (process.env.NODE_ENV === 'development') {
    //   console.error(cause);
    // }

    let error = cause as ServerError;
    const critical = true;
    if (!(cause instanceof ServerError)) {
      error = new ServerError({
        name: 'AppServerError',
        message: options.message || type,
        critical,
        cause,
      });
    }
    if (critical) {
      this.status = AppServer.STATE.FAILED;
    }
    // TODO Log the SeverError
    if (this.logger.started) {
      this.logger.log({ error });
    } else {
      console.error(error);
    }
    // TODO LoggerService may not have started yet
    // Prevent restart (if needed)
    if (options.preventPm2Restart) {
      this.exitCode = 1;
      // TODO set up PM2 to not restart on exit code 1
    }
    // TODO Exit process
  }
}
