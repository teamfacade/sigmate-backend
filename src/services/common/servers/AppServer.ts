import express, { Express } from 'express';
import cors from 'cors';
import passport from 'passport';
import checkEnv from '../../../utils/checkEnv';
import BaseServer from './BaseServer';
import requestIp from 'request-ip';
import AuthService from '../auth/AuthService';
import LoggerService from '../logging/LoggerService';
import { Server } from 'http';
import { checkServices, setService } from '../..';
import DatabaseService from '../database/DatabaseService';
import AppServerError from '../errors/AppServerError';
import { waitTimeout } from '../../../utils/wait';

export default class AppServer extends BaseServer {
  static EVENTS = {
    START: 'Server starting...',
    DB_CONNECT: 'Connecting to database...',
    DB_CONNECTED: 'Database connected',
    STARTED: 'Server started!',
    START_FAIL: 'Server failed to start!',
    CLOSE: 'Server closing...',
    CLOSED: 'Server closed. Shutting down...',
  };

  /** Check if all environment variables have been set correctly */
  static checkEnv() {
    const envSuffixes: Record<typeof process.env.NODE_ENV, string> = {
      development: 'DEV',
      production: 'PROD',
      test: 'TEST',
    };
    const envSuffix = envSuffixes[process.env.NODE_ENV];

    checkEnv('NODE_ENV');
    checkEnv('SERVICE_NAME');
    checkEnv('PORT');
    checkEnv(`DB_DATABASE_${envSuffix}`);
    checkEnv(`DB_USERNAME_${envSuffix}`);
    checkEnv(`DB_PASSWORD_${envSuffix}`);
    checkEnv(`DB_HOST_${envSuffix}`);
    checkEnv('DB_PORT');
    checkEnv('COOKIE_SECRET');
    checkEnv('GOOGLE_CLIENT_ID');
    checkEnv('GOOGLE_CLIENT_SECRET');
    checkEnv('PATH_PUBLIC_KEY');
    checkEnv('PATH_PRIVATE_KEY');
    checkEnv('AWS_BUCKET_NAME');
    checkEnv('AWS_ACCESS_KEY');
    checkEnv('AWS_SECRET_ACCESS_KEY');
    checkEnv('AWS_LOGGER_ACCESS_KEY');
    checkEnv('AWS_LOGGER_SECRET_ACCESS_KEY');
    checkEnv('AWS_S3_IMAGE_BASEURL');
  }

  static initialized = false;

  app: Express;
  /**
   * HTTP server instance created by Express.
   * Later used to close the server gracefully upon shutdown
   */
  server?: Server;
  db?: DatabaseService;
  logger: LoggerService;

  /**
   * In the server constructor...
   *
   * - **DO** initialize necessary variables, class instances, etc.
   * - **DO NOT** connect to external services, perform I/O
   * - **DO NOT** perform asynchronous tasks
   *
   * This is to minimize the possibility of unexpected errors,
   * as the logger and error handling services has not yet been initialized.
   *
   * Perform necessary asynchronous tasks in the `start` method instead.
   *
   * @throws Error if more than one instance is attempted to be created
   */
  constructor() {
    if (AppServer.initialized) {
      throw new Error('An instance of AppServer already exists!');
    }
    super();
    AppServer.checkEnv();
    const logger = new LoggerService();
    this.logger = logger;
    setService('logger', logger);

    // Check environment variables
    const app = express();
    this.app = app;

    AppServer.initialized = true;

    // Graceful shutdown
    process.on('SIGINT', () => {
      this.close().then(() => {
        process.exit(0);
      });
    });
  }

  logServerEvent(event: keyof typeof AppServer.EVENTS) {
    // Log message
    const msg = `${AppServer.EVENTS[event]} (${this.id})`;

    // Log info
    let level: sigmate.Logger.LogLevel = 'info';
    let status: sigmate.Logger.ActionStatus = 'STARTED';
    switch (event) {
      case 'START':
      case 'CLOSE':
        status = 'STARTED';
        break;
      case 'STARTED':
      case 'CLOSED':
        status = 'FINISHED';
        break;
      case 'DB_CONNECT':
      case 'DB_CONNECTED':
        status = 'IN_PROGRESS';
        level = 'silly';
        break;
      case 'START_FAIL':
        status = 'ERROR';
        level = 'error';
        break;
    }
    const info: Omit<sigmate.Logger.LogInfo, 'message'> = {
      level,
      status: {
        action: status,
      },
    };
    this.logger?.logServerEvent(msg, info);
  }

  async start() {
    this.logServerEvent('START');

    const app = this.app;

    // Set up middlewares from external libraries
    try {
      app.set('port', process.env.PORT);
      app.use(cors()); // TODO Set properly on production
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(requestIp.mw());
    } catch (e) {
      return this.handleError('START/3P', e);
    }

    try {
      this.logServerEvent('DB_CONNECT');
      const db = new DatabaseService();
      await db.test(true);
      setService('db', db);
      this.db = db;
      this.logServerEvent('DB_CONNECTED');
    } catch (e) {
      return this.handleError('START/DB', e);
    }

    try {
      passport.use(AuthService.PASSPORT_STRATEGY_JWT);
      app.use(passport.initialize());
    } catch (e) {
      return this.handleError('START/AUTH', e);
    }

    try {
      checkServices();
    } catch (error) {
      return this.handleError('START/SERVICES');
    }

    this.server = app.listen(app.get('port'), () => {
      this.logServerEvent('STARTED');
      this.afterStart();
    });
  }

  /**
   * Create a new AppServerError and log it
   * @param message Error message key
   * @param origin The original Error object
   */
  handleError(
    message: keyof typeof AppServerError['MESSAGES'],
    origin: unknown = undefined
  ) {
    const error = new AppServerError(message, origin);
    // TODO Log the AppServerError
    this.logger.logServerError(error);
    this.logServerEvent('START_FAIL');
  }

  afterStart() {
    // Send ready signal to PM2
    // https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
    if (process.send) process.send('ready');
  }

  async close() {
    // Close call prevents server from receiving new connections
    const server = this.server?.close();
    this.logServerEvent('CLOSE');

    // Wait for all existing connections to end
    const serverClose = new Promise<void>((resolve) => {
      server?.on('close', () => {
        resolve();
      });
    });
    await waitTimeout(serverClose, 5000);
    this.logServerEvent('CLOSED');

    // Close all loggers
    const loggerClose = this.logger?.close();
    await waitTimeout(loggerClose, 5000);
  }
}
