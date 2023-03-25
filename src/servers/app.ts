import { Server } from 'http';
import express from 'express';
import requestIp from 'request-ip';
import cors from 'cors';
import dotenv from 'dotenv';
import SigmateServer from '.';
import { checkEnv, timeoutAfter } from '../utils';
import RequestMw from '../middlewares/request';
import { db } from '../services/database';
import { logger } from '../services/logger';
import apiV2Router from '../routes/api';
import { auth } from '../services/auth';
import ErrorMw from '../middlewares/error';
import { googleAuth } from '../services/auth/google';
import { account } from '../services/account';
import { metamaskAuth } from '../services/auth/metamask';
import { s3Service } from '../services/s3';
import { fileService } from '../services/file';
import { imageService } from '../services/file/image';
import staticRouter from '../routes/static';
import uploadV2Router from '../routes/upload';
import { dynamodb } from '../services/dynamodb';
import { wikiDiff } from '../services/wiki/diff';
import { wikiExtData } from '../services/wiki/extdata';

export default class AppServer extends SigmateServer {
  static PORT = 5100;

  app: express.Express;
  server?: Server;

  constructor() {
    super('App');
    dotenv.config();
    checkEnv([
      'NODE_ENV',
      'PORT',
      'DB_PORT',
      'DB_DATABASE',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_HOST',
      'AWS_REGION',
      'AWS_BUCKET_NAME',
      'AWS_ACCESS_KEY',
      'AWS_SECRET_ACCESS_KEY',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'DISCORD_CLIENT_ID',
      'DISCORD_CLIENT_SECRET',
      'TWITTER_BEARER_TOKEN',
      'LAMBDA_BOT_URL',
    ]);
    this.app = express();
  }

  public async start() {
    this.setStatus('STARTING');

    // Start services
    await logger.start();
    await db.start();
    await dynamodb.start();
    await Promise.all([
      auth.start(),
      googleAuth.start(),
      metamaskAuth.start(),
      account.start(),
      s3Service.start(),
      fileService.start(),
      imageService.start(),
      wikiDiff.start(),
      wikiExtData.start(),
    ]);

    const app = this.app;

    // Middlewares
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(requestIp.mw());
    app.use(RequestMw.device());
    app.use(RequestMw.metadata());

    // Routes
    app.use('/static', staticRouter);

    // Logged Routes
    app.use(RequestMw.logger());
    app.use('/api/v2', apiV2Router);
    app.use('/upload/v2', uploadV2Router);

    // Error handling middlwares
    app.use(ErrorMw.request);

    // Start listening
    const port = process.env.PORT || AppServer.PORT;
    this.server = app.listen(port, this.onStart.bind(this));
    this.setStatus('AVAILABLE');
  }

  public async close() {
    this.setStatus('CLOSING');
    if (this.server) {
      const server = this.server;
      let closed = true;
      if (typeof server.closeIdleConnections === 'function') {
        try {
          server.closeIdleConnections();
          await timeoutAfter(this.closeServer(), 5000, { reject: true });
        } catch (error) {
          console.error(error);
          closed = false;
        }
      }
      if (!closed && typeof server.closeAllConnections === 'function') {
        try {
          server.closeAllConnections();
          await timeoutAfter(this.closeServer(), 2000);
        } catch (error) {
          console.log('Failed to close server');
          console.error(error);
        }
      }
    }
    await db.close();
    await Promise.all([
      auth.close(),
      googleAuth.close(),
      metamaskAuth.close(),
      account.close(),
      dynamodb.close(),
      wikiDiff.close(),
      wikiExtData.close(),
    ]);
    this.setStatus('CLOSED');
    await logger.close();

    // Ensure socket is released by killing the process
    process.exit(0);
  }

  private onStart() {
    process.on('SIGINT', this.onSigint.bind(this));
    if (process.send) process.send('ready'); // PM2 Cluster Mode
  }

  private onSigint() {
    process.removeAllListeners('SIGINT');
    console.log('SIGINT(^C) received');
    this.close();
  }

  private closeServer() {
    return new Promise<void>((resolve, reject) => {
      if (!this.server) return resolve();
      this.server.close((err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}
