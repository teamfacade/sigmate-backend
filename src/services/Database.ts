import { Sequelize } from 'sequelize-typescript';
import Service from './Service';
import config from '../config';
import { models, importModels } from '../models';
import DatabaseError from './errors/DatabaseError';
import { wait } from '../utils';

type ErrorTypes = 'CONNECT' | 'TEST' | 'NOT_AVAILABLE';

const env = process.env.NODE_ENV;

export default class Database extends Service {
  static sequelize: Sequelize = undefined as unknown as Sequelize;
  static get transaction() {
    return this.sequelize.transaction;
  }
  static connected = false;
  static TEST_DELAY_INIT = 400;
  static TEST_RETRY_MAX = 10;
  static testDelay = this.TEST_DELAY_INIT;
  static testRetries = 0;

  /**
   * Connect to the database and test the connection
   */
  static async start() {
    this.status = Database.STATE.STARTING;
    // TODO Log service starting
    const { database, username, password } = config.database[env];
    this.sequelize = new Sequelize(
      database,
      username,
      password,
      config.database[env]
    );
    await importModels();
    this.sequelize.addModels(models);
    await this.test();
    this.status = Database.STATE.STARTED;
    // TODO Log service started
  }

  /**
   * Run the test once (called by static method `test()`)
   */
  private static async __test() {
    try {
      await this.sequelize.authenticate();
      this.connected = true;
      this.testDelay = 100; // reset the test delay
    } catch (error) {
      this.connected = false;
      this.onError({
        type: 'CONNECT',
        message: `Database connection failed (${this.testRetries}/${this.TEST_RETRY_MAX}). Retrying...`,
        error,
      });
    }
  }

  /**
   * Run tests with exponential delay for a certain number of times
   * before giving up.
   */
  static async test() {
    while (!this.connected && this.testRetries <= this.TEST_RETRY_MAX) {
      this.testRetries += 1;
      await this.__test();
      await wait(this.testDelay);
      this.testDelay *= 2;
    }
    if (!this.connected) {
      this.onError({
        type: 'TEST',
        message: `Database connection failed ${this.testRetries} times in a row. Stopped.`,
      });
    }
  }

  /**
   * Close the DB connection
   */
  static async close() {
    this.status = Database.STATE.CLOSING;
    // TODO Log service closing
    await this.sequelize.close();
    this.status = Database.STATE.CLOSED;
    // TODO Log service closed
  }

  /**
   * Run a function containing database query call(s)
   * @param worker Function containing the database query call
   * @returns Return value of worker
   */
  static async run<T>(worker: () => Promise<T>) {
    if (this.closed) this.onError({ type: 'NOT_AVAILABLE' });
    if (!this.connected) await wait(this.testDelay);
    if (!this.connected) this.onError({ type: 'NOT_AVAILABLE' });
    return worker();
  }

  /**
   * Handle database errors
   */
  private static onError(
    options: sigmate.Error.HandlerOptions<ErrorTypes>
  ): void {
    const { type = 'OTHER', error } = options;
    let message = options.message || type;
    let critical = false;
    switch (type) {
      case 'CONNECT':
        break;
      case 'NOT_AVAILABLE':
        message = 'Database is not available.';
        break;
      case 'TEST':
      default:
        critical = true;
        break;
    }
    if (critical) {
      this.status = Database.STATE.FAILED;
    }
    throw new DatabaseError({ message, critical, cause: error });
  }
}
