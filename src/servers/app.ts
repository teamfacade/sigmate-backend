import dotenv from 'dotenv';
import express, { Express } from 'express';
import { Server as HttpServer } from 'http';
import cors from 'cors';
import BaseServer from '.';
import DatabaseService from '../services/DatabaseService';
import AppServerError from '../services/errors/AppServerError';
import { isEnvVarSet, waitTimeout } from '../utils';

export default class AppServer extends BaseServer {
  app: Express;
  server?: HttpServer;
  // TODO Prevent server from restarting on non-zero exitcode
  exitCode: number;

  constructor() {
    super('App');
    try {
      dotenv.config();
      this.checkEnv();
      this.app = express();
      this.exitCode = 0;
    } catch (err) {
      let error = err;
      if (!(error instanceof AppServerError)) {
        error = new AppServerError({
          code: 'SERVER/APP/ER_CTOR',
          error,
        });
      }
      throw error;
    }
  }

  private checkEnv() {
    // Check environment variables
    const requiredEnvVars = [
      'NODE_ENV',
      'DEBUG_LOG_LEVEL',
      'SERVICE_NAME',
      'PORT',
      'PATH_PUBLIC_KEY',
      'PATH_PRIVATE_KEY',
      'COOKIE_SECRET',
      'DB_PORT',
      'DB_DATABASE_DEV',
      'DB_DATABASE_TEST',
      'DB_DATABASE_PROD',
      'DB_USERNAME_DEV',
      'DB_USERNAME_TEST',
      'DB_USERNAME_PROD',
      'DB_PASSWORD_DEV',
      'DB_PASSWORD_TEST',
      'DB_PASSWORD_PROD',
      'DB_HOST_DEV',
      'DB_HOST_TEST',
      'DB_HOST_PROD',
      'AWS_BUCKET_NAME',
      'AWS_ACCESS_KEY',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_LOGGER_ACCESS_KEY',
      'AWS_LOGGER_SECRET_ACCESS_KEY',
      'AWS_S3_IMAGE_BASEURL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'DISCORD_CLIENT_ID',
      'DISCORD_CLIENT_SECRET',
      'TWITTER_BEARER_TOKEN',
      'LAMBDA_BOT_URL',
    ];
    const notSetArray: string[] = [];
    const isAllSet = requiredEnvVars.reduce(
      (isAllSet, varName) => isAllSet && isEnvVarSet(varName, { notSetArray }),
      true
    );

    if (!isAllSet) {
      throw new AppServerError({ code: 'SERVER/APP/NF_ENV' });
    }
  }

  public async start(): Promise<void> {
    this.setStatus('STARTING');
    // Start services
    const db = new DatabaseService({ createInstance: true });
    await db.start();

    // Setup middlewares
    const app = this.app;
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true, type: 'application/json' }));

    // Open http server
    const port = process.env.PORT || 5100;
    this.server = this.app.listen(port, () => this.setStatus('STARTED'));
  }

  protected onStarted = () => {
    // Graceful shutdown on SIGINT
    process.on('SIGINT', this.onSigint.bind(this));

    // (PM2 Cluster Mode) Send a 'ready' signal to the parent process
    if (process.send) process.send('ready');
  };

  /** Graceful shutdown on SIGINT (Ctrl+C) */
  private onSigint(): void {
    // Prevent listeners from accumulating on nodemon
    process.removeAllListeners('SIGINT');
    console.log('SIGINT(^C) received'); // Don't use logger
    this.close().then(() => {
      process.exit(this.exitCode || 0);
    });
  }

  /**
   * Stop new connections, and wait for existing ones to end
   * @param options Set `force` to `true` to not wait for existing connections to end
   * @returns Promise that resolves on server 'close' event
   */
  private closeServer(options: { force?: boolean } = {}) {
    return new Promise<boolean>((resolve, reject) => {
      if (!this.server) return resolve(false);
      this.server.closeIdleConnections();
      if (options?.force) {
        this.server.closeAllConnections();
      }
      this.server.close((err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  public async close(): Promise<void> {
    this.setStatus('CLOSING');

    // Close server: Stop receiving new connections
    if (this.server) {
      let closed;
      try {
        closed = await waitTimeout(this.closeServer(), 5000);
      } catch (error) {
        console.error(error); // TODO
      }
      if (closed === null) {
        try {
          closed = await waitTimeout(this.closeServer(), 5000);
        } catch (error) {
          console.error(error); // TODO
        }
      }
    }

    // Close services
    try {
      const db = DatabaseService.getInstance({ throws: false });
      if (db) await db.close();
    } catch (error) {
      console.error(error); // TODO
    }

    this.setStatus('CLOSED');
  }
}
