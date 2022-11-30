import { Server as HttpServer } from 'http';
import express, { Express } from 'express';
import cors from 'cors';
import passport from 'passport';
import ServerError from '../errors/ServerError';
import Server from './Server';
import requestIp from 'request-ip';
import { waitTimeout } from '../../utils';
import Logger from '../logger/Logger';
import { ServerStatus } from '../../utils/status';
import Database from '../Database';

type ErrorTypes = 'INIT';

export default class AppServer extends Server {
  server?: HttpServer;
  app: Express = undefined as unknown as Express;
  logger?: any;
  db?: any;
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
  }

  async start() {
    this.status = ServerStatus.STARTING;
    const app = express();
    // Start Logger
    try {
      Logger.start();
    } catch (error) {
      this.onError({ error });
    }
    // TODO Log server starting
    // Start Database
    try {
      await Database.start();
    } catch (error) {
      this.onError({ error });
    }
    // Start Auth
    // Set up middlewares
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(requestIp.mw());
    app.use(passport.initialize());
    // app.use(logger.mw);
    // app.use(db.mw);
    // app.use(auth.mw);

    // Start HTTP server
    this.server = app.listen(process.env.PORT || 5100, this.onStart);
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
    if (process.send) process.send('ready');
    // TODO Log server started
  }

  onSigint(): void {
    this.close().then(() => {
      process.exit(0);
    });
  }

  async close() {
    this.status = ServerStatus.CLOSING;
    // TODO Log server closing
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
      await Database.close();
      // Close Logger
      await Logger.close();
    } catch (error) {
      this.onError({ message: 'Graceful shutdown failed', error });
    }
    this.status = ServerStatus.CLOSED;
    // TODO Log server closed
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
    this.status = ServerStatus.FAILED;
    const { type = 'OTHER', error: cause } = options;
    let serverError: ServerError | undefined = undefined;
    if (cause instanceof ServerError) {
      serverError = cause;
    } else {
      const message: string = options.message || type;
      let critical = false;
      switch (type) {
        default:
          critical = true;
          break;
      }
      serverError = new ServerError({
        name: 'AppServerError',
        message,
        critical,
        cause,
      });
    }
    throw serverError; // TODO don't throw
    // TODO Log the SeverError
    // Prevent restart (if needed)
    if (options.preventPm2Restart) {
      this.exitCode = 1;
      // TODO set up PM2 to not restart on exit code 1
    }
    // TODO Exit process
  }
}
