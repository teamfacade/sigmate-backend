import { resolve } from 'path';
import { Sequelize } from 'sequelize-typescript';
import Service from '.';
import DatabaseError from '../errors/database';
import { waitFor } from '../utils';

export default class DatabaseService extends Service {
  static RETRY = 500;
  static DELAY = 500;
  static MAX_DELAY = 5 * 60 * 1000; // 5 minutes

  __sequelize?: Sequelize;
  get sequelize() {
    if (!this.__sequelize) throw new Error('Sequelize not initialized');
    return this.__sequelize;
  }
  constructor() {
    super('Database');
  }

  /**
   * Runs database queries with proper error handling
   * @param task Promise containing DB query
   * @returns DB query results
   */
  async run<T>(task: () => Promise<T>) {
    if (this.status !== 'AVAILABLE') {
      return; // TODO throw service unavailable error
    }
    try {
      return await task();
    } catch (error) {
      const dbErr = new DatabaseError({ error });
      if (
        dbErr.critical ||
        dbErr.code === 'DB/SEQ/TIMEOUT' ||
        dbErr.code === 'DB/SEQ/OTHER'
      ) {
        this.setStatus('UNAVAILABLE');
        this.test({ infinite: true });
      }
      throw dbErr;
    }
  }

  async start() {
    this.setStatus('STARTING');
    try {
      const username = process.env.DB_USERNAME;
      const password = process.env.DB_PASSWORD;
      const database = process.env.DB_DATABASE;
      const host = process.env.DB_HOST;
      const port = process.env.DB_PORT;
      const modelPath = resolve(__dirname, '../models/**/*.model');
      this.__sequelize = new Sequelize({
        username,
        password,
        database,
        host,
        port,
        dialect: 'mysql',
        timezone: '+00:00',
        dialectOptions: {
          timezone: '+00:00',
        },
        logging: false,
        benchmark: process.env.NODE_ENV !== 'production',

        models: [`${modelPath}.ts`, `${modelPath}.js`],
        modelMatch: (filename, member) => {
          return (
            filename.substring(0, filename.indexOf('.model')) === member ||
            member === 'default'
          );
        },
      });

      if (this.env === 'development') {
        await this.__sequelize.sync({ force: false });
      }

      await this.test();
      this.setStatus('AVAILABLE');
    } catch (error) {
      this.setStatus('UNAVAILABLE');
      throw new DatabaseError({ error });
    }
  }

  async test(options: { infinite?: boolean } = {}) {
    let count = DatabaseService.RETRY;
    let delay = DatabaseService.DELAY;
    let maxDelayReached = false;
    let dbError: unknown = undefined;
    while (options.infinite || count > 0) {
      try {
        await this.sequelize.authenticate();
        this.setStatus('AVAILABLE');
        break;
      } catch (error) {
        this.setStatus('UNAVAILABLE');
        dbError = error;
        await waitFor(delay);
        if (!maxDelayReached) {
          delay *= 2;
          if (delay > DatabaseService.MAX_DELAY) {
            delay /= 2;
            maxDelayReached = true;
          }
        }
      }
      count--;
    }
    if (this.status !== 'AVAILABLE') {
      throw dbError;
    }
  }

  async close() {
    if (!this.__sequelize) return;
    this.setStatus('CLOSING');
    await this.sequelize.close();
    this.setStatus('CLOSED');
  }
}

export const db = new DatabaseService();
