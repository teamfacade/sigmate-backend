import { Server as HttpServer } from 'http';
import express, { Express } from 'express';
import cors from 'cors';
import passport from 'passport';
import ServerError from '../errors/ServerError';
import Server from './Server';
import requestIp from 'request-ip';
import { waitTimeout } from '../../utils';
import Logger from '../loggers/Logger';
import { ServerStatus } from '../status';

type ErrorTypes = 'INIT' | 'START/LOGGER';

export default class AppServer extends Server {
  server?: HttpServer;
  app: Express = undefined as unknown as Express;
  logger?: any;
  db?: any;
  auth?: any;

  constructor() {
    super();
    if (AppServer.initialized) {
      this.onError({
        type: 'INIT',
        message: 'Instance of AppServer already exists.',
      });
    }
    AppServer.initialized = true;
  }

  async start() {
    const app = express();
    // Start logger
    try {
      Logger.start();
    } catch (error) {
      this.onError({ type: 'START/LOGGER', error });
    }
    // Log server starting
    // Start db
    // Start auth
    // Start server
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(requestIp.mw());
    app.use(passport.initialize());
    // app.use(logger.mw);
    // app.use(db.mw);
    // app.use(auth.mw);
    this.app = app;
    this.onStart();
  }

  /**
   * Chores to do after a successful server start
   * - Log the successful server start
   * - (PM2 Cluster Mode) Send a 'ready' signal to the parent process
   *   https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
   */
  onStart(): void {
    this.status = ServerStatus.STARTED;
    if (process.send) process.send('ready');
    // Log server start success
  }

  onSigint(): void {
    this.close().then(() => {
      process.exit(0);
    });
  }

  async close() {
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

    // Close Logger
    // Close DB
    this.status = ServerStatus.CLOSED;
    // Log server closed
  }

  onError(options: sigmate.Error.HandlerOptions<ErrorTypes>): void {
    const { type = 'OTHER', error: origin } = options;
    const message: string = options.message || type;
    let critical = false;
    switch (type) {
      default:
        critical = true;
        break;
    }
    throw new ServerError({
      name: 'AppError',
      message,
      critical,
      cause: origin,
    });
  }
}
