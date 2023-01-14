import { Sequelize } from 'sequelize-typescript';
import Service, { ServiceOptions } from '.';
import config from '../config';
import { retry, RetryReturnType } from '../utils/retry';
import DatabaseError from './errors/DatabaseError';
import ServiceError from './errors/ServiceError';

export default class DatabaseService extends Service {
  sequelize?: Sequelize;
  constructor({ createInstance }: ServiceOptions = {}) {
    if (DatabaseService.instance) {
      throw new ServiceError({ code: 'SERVICE/ALREADY_INIT' });
    }
    super({ name: 'Database', createInstance });
  }

  /** Run database queries with proper error handling */
  public async run<T>(task: () => Promise<T>) {
    if (!this.isAvailable()) await this.test();
    if (!this.isAvailable()) {
      throw new ServiceError({ code: 'SERVICE/UNAVAILABLE' });
    }
    try {
      return await task();
    } catch (error) {
      throw new DatabaseError({ error });
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
    this.setStatus('CLOSING');
    this.sequelize?.close();
    this.setStatus('CLOSED');
  }
}
