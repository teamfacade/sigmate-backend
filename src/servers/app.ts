import dotenv from 'dotenv';
import express, { Express } from 'express';
import { Server as HttpServer } from 'http';
import cors from 'cors';
import luxon from 'luxon';
import requestIp from 'request-ip';
import BaseServer from '.';
import { db } from '../services/DatabaseService';
import AppServerError from '../services/errors/AppServerError';
import { isEnvVarSet, waitTimeout } from '../utils';
import LoggerMiddleware from '../middlewares/logger';
import { logger } from '../services/logger/LoggerService';
import { redis } from '../services/RedisService';
import HeaderMiddleware from '../middlewares/header';
import apiRouter from '../routes/api';

export default class AppServer extends BaseServer {
  app: Express;
  server?: HttpServer;
  // TODO Prevent server from restarting on non-zero exitcode
  exitCode: number;

  constructor() {
    super('app');
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
      'SERVICE_NAME',
      'PORT',
      'DB_PORT',
      'DB_DATABASE',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_HOST',
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
      'REDIS_HOST',
      'REDIS_PORT',
      'REDIS_ACL_USERNAME',
      'REDIS_ACL_PASSWORD',
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
    try {
      // Set server timezone
      luxon.Settings.defaultZone = 'utc';

      // Start services
      await logger.start();
      this.setStatus('STARTING'); // Log server starting after logger start
      await db.start();
      await redis.start();

      // Setup middlewares
      const app = this.app;
      app.use(cors());
      app.use(express.json());
      app.use(express.urlencoded({ extended: true, type: 'application/json' }));
      app.use(requestIp.mw());
      app.use(LoggerMiddleware.mw('request'));
      app.use(HeaderMiddleware.parseDevice({ detect: true }));
      app.use(HeaderMiddleware.parseLocation({ geo: false }));

      // Setup routes
      app.use('/api', apiRouter);

      // Open http server
      const port = process.env.PORT || 5100;
      this.server = this.app.listen(port, () => this.setStatus('STARTED'));
    } catch (error) {
      await this.close();
      this.setStatus('FAILED');
      throw error;
    }
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
        logger.log({ server: this, error });
      }
      if (closed === null) {
        try {
          closed = await waitTimeout(this.closeServer(), 5000);
        } catch (error) {
          logger.log({ server: this, error });
        }
      }
    }

    // Close services
    try {
      if (db) await db.close();
      if (logger) await logger.close();
    } catch (error) {
      logger.log({ server: this, error });
    }

    this.setStatus('CLOSED');
  }
}
