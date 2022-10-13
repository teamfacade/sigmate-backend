import { Sequelize } from 'sequelize-typescript';
import databaseConfig from '../../../config/database';
import SequelizeError from '../../../utils/errors/SequelizeError';

type DatabaseRunOptions = {
  /**
   * Throw the task's error to the caller
   */
  throw?: boolean;
};

type DatabaseRunResult<T> = {
  success: boolean;
  error?: Error | unknown;
  data?: T;
};

export default class DatabaseEngine {
  sequelize: Sequelize;
  conntected = false;

  constructor(
    env: typeof process.env.NODE_ENV,
    sequelize: Sequelize | undefined = undefined
  ) {
    if (sequelize) {
      this.sequelize = sequelize;
    } else {
      console.log('⏱ Database connect...\tSTARTING');
      const config = databaseConfig[env];
      const { database: d, username: u, password: p } = config;
      this.sequelize = new Sequelize(d, u, p, config);
    }

    this.sequelize
      .authenticate()
      .then(() => {
        console.log('✅ Database connect...\tSUCCESS');
        this.conntected = false;
      })
      .catch((error) => {
        console.error(error);
        console.log('❌ Database connect...\tFAILED');
      });
  }

  async run<T>(
    task: Promise<T>,
    options: DatabaseRunOptions = {}
  ): Promise<DatabaseRunResult<T>> {
    const result: DatabaseRunResult<T> = {
      success: true,
    };
    try {
      result.data = await task;
    } catch (error) {
      if (options.throw) {
        throw new SequelizeError(error as Error);
      }
      result.success = false;
      result.error = error;
    }
    return result;
  }
}
