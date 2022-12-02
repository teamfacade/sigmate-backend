import { Sequelize } from 'sequelize-typescript';
import Service from './Service';
import config from '../config';
import { models, importModels } from '../models';
import DatabaseError from './errors/DatabaseError';
import { wait } from '../utils';
import Logger from './logger';

type ErrorTypes = 'CONNECT' | 'TEST' | 'CLOSED' | 'UNAVAILABLE';

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
  static testPromise: Promise<void> | undefined = undefined;
  name = 'DATABASE';
  logger: Logger = undefined as unknown as Logger;
  get serviceStatus() {
    return Database.status;
  }
  get sequelize() {
    return Database.sequelize;
  }
  get transaction() {
    return Database.sequelize.transaction;
  }

  constructor(options: { checkStart?: boolean } = {}) {
    super();
    const { checkStart = true } = options;
    if (!Database.started && checkStart) {
      throw new DatabaseError({
        message: 'Database initialized before start',
        critical: true,
        database: this,
      });
    }
  }

  /**
   * Connect to the database and test the connection
   */
  async start() {
    this.logger = new Logger();
    Database.status = Database.STATE.STARTING;
    this.logger.log({ service: this });
    const { database, username, password } = config.database[env];
    Database.sequelize = new Sequelize(
      database,
      username,
      password,
      config.database[env]
    );
    await importModels();
    Database.sequelize.addModels(models);
    await this.test();
    Database.status = Database.STATE.STARTED;
    this.logger.log({ service: this });
  }

  /**
   * Run tests with exponential delay for a certain number of times
   * before giving up.
   */
  private async __test() {
    while (
      !Database.connected &&
      Database.testRetries <= Database.TEST_RETRY_MAX
    ) {
      Database.testRetries += 1;
      try {
        await Database.sequelize.authenticate();
        Database.connected = true;
        Database.testDelay = 100; // reset the test delay
      } catch (error) {
        Database.connected = false;
        this.onError({
          type: 'CONNECT',
          message: `Database connection failed (${Database.testRetries}/${Database.TEST_RETRY_MAX}). Retrying...`,
          error,
        });
      }
      await wait(Database.testDelay);
      Database.testDelay *= 2;
    }
    if (!Database.connected) {
      this.onError({
        type: 'TEST',
        message: `Database test failed!`,
      });
    }
  }

  /**
   * Ensure that only one test runs
   */
  public async test() {
    if (!Database.testPromise) {
      Database.testPromise = this.__test();
    }
    await Database.testPromise;
    Database.testPromise = undefined;
  }

  /**
   * Run a function containing database query call(s)
   * @param worker Function containing the database query call
   * @returns Return value of worker
   */
  async run<T>(worker: () => Promise<T>) {
    if (Database.closed) this.onError({ type: 'CLOSED' });
    if (!Database.connected) await wait(Database.testDelay);
    if (!Database.connected) this.onError({ type: 'UNAVAILABLE' });
    try {
      return await worker();
    } catch (error) {
      this.onError({ error });
    }
  }

  /**
   * Handle database errors
   * @throws {DatabaseError}
   */
  private onError(options: sigmate.Error.HandlerOptions<ErrorTypes>): never {
    const { type = 'OTHER', error } = options;
    let message = options.message || type;
    let critical = false;
    switch (type) {
      case 'CONNECT':
        // error message sent from caller
        break;
      case 'CLOSED':
        message = 'Database run rejected (Database closed)';
        break;
      case 'UNAVAILABLE':
        message = 'Database run rejected (Database not connected)';
        break;
      case 'TEST':
      default:
        critical = true;
        break;
    }
    if (critical) {
      Database.status = Database.STATE.FAILED;
    }
    throw new DatabaseError({
      database: this,
      message,
      critical,
      cause: error,
    });
  }

  /**
   * Close the DB connection
   */
  async close() {
    Database.status = Database.STATE.CLOSING;
    // TODO Log service closing
    await Database.sequelize.close();
    Database.status = Database.STATE.CLOSED;
    // TODO Log service closed
  }
}
