import { Sequelize } from 'sequelize-typescript';
import config from '../config';
import { retry, RetryReturnType } from '../utils';
import DatabaseError from './errors/DatabaseError';
import ServerError from './errors/ServerError';
import ServiceError from './errors/ServiceError';
import SingletonService from './SingletonService';

export default class DatabaseService extends SingletonService {
  public static instance: DatabaseService;

  sequelize?: Sequelize;
  constructor() {
    super({ name: 'Database' });
  }

  /** Run database queries with proper error handling */
  public async run<T>(task: (sequelize: Sequelize) => Promise<T>) {
    if (!this.started) {
      throw new ServiceError({ code: 'SERVICE/UA_NOT_STARTED' });
    }
    if (!this.isAvailable()) await this.test();
    if (!this.isAvailable() || !this.sequelize) {
      throw new ServiceError({ code: 'SERVICE/UA' });
    }
    try {
      return await task(this.sequelize);
    } catch (error) {
      if (error instanceof ServerError) {
        throw error;
      } else {
        throw new DatabaseError({ error });
      }
    }
  }

  private async __start() {
    try {
      if (!this.sequelize) {
        const env = process.env.NODE_ENV;
        const dbConfig = config.database[env];

        this.sequelize = new Sequelize({
          ...dbConfig,
          models: [__dirname + '/**/*.model.ts'],
          modelMatch: (filename, member) => {
            return (
              filename.substring(0, filename.indexOf('.model')) ===
              member.toLowerCase()
            );
          },
        });
      }
    } catch (error) {
      this.setStatus('UNAVAILABLE');
      throw new DatabaseError({ error });
    }
  }

  /** Establish connection with database */
  public async start() {
    this.setStatus('STARTING');
    const { success } = await retry(this.__start.bind(this), {
      delayMs: 400,
      delayIncExp: true,
      delayMaxMs: 1 * 60 * 1000,
      // TODO onFail: log database error
    });

    await this.test();
    this.setStatus(success ? 'AVAILABLE' : 'FAILED');
  }

  private testPromise?: Promise<RetryReturnType<void>>;
  private async __test() {
    try {
      await this.sequelize?.authenticate();
      this.setStatus('AVAILABLE');
    } catch (error) {
      this.setStatus('UNAVAILABLE');
      throw new DatabaseError({ error });
    }
  }

  /** Test connection with the database */
  public async test() {
    if (!this.testPromise) {
      this.testPromise = retry(this.__test.bind(this), {
        maxAttempts: 5,
        delayMs: 1000,
        // TODO onFail: log database error
      });
    }
    const { success } = await this.testPromise;
    this.setStatus(success ? 'AVAILABLE' : 'FAILED');
    this.close();
  }

  /** Close database connection */
  public async close() {
    if (!this.started) return;
    this.setStatus('CLOSING');
    this.sequelize?.close();
    this.setStatus('CLOSED');
  }
}

export const db = new DatabaseService();
