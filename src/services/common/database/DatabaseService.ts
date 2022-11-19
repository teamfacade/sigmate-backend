import { Sequelize } from 'sequelize-typescript';
import config from '../../../config';
import models, { importModels } from '../../../models';
import wait from '../../../utils/wait';
import BaseService from '../base/BaseService';
import SequelizeError from '../errors/SequelizeError';
import ServerError from '../errors/ServerError';
import DatabaseLoggerService from '../logging/DatabaseLoggerService';

const env = process.env.NODE_ENV;

export default class DatabaseService extends BaseService {
  /**
   * Ensures that only one instance of Sequelize exists in this server
   */
  static sequelize?: Sequelize;

  /**
   * Ensures only one databaseLogger instance exists for this service
   */
  static logger?: DatabaseLoggerService;

  // Connection test related properties
  /** Initial retry delay on bad DB connection (milliseconds) */
  static retryDelayInitial = 200;
  /** Number of times to retry the database test */
  static retryCountLimit = 5;

  /**
   * Status of the database connection.
   *
   * Possible values and side-effects:
   * - `true`: Everything is normal.
   * - `undefined`: A test has never been performed yet, or one is in progress.
   *     - New database queries will wait for a connection test to succeed
   *       (i.e. await the `testPromise` to resolve to `true`)
   *       before continuing.
   * - `false`: The last connection test failed.
   *     - New database queries will be rejected (i.e. the `run()` method
   *       will always throw an error), causing the user's request to fail.
   */
  static connected?: boolean;
  /**
   * A promise that runs the connection test. Resolves to a boolean value
   * containing the test result.
   *
   * @returns `true` on test success, `false` on failure
   */
  static testPromise?: Promise<boolean>;
  /** Error object thrown during the last connection test */
  static testError?: unknown;

  static started = false;

  static async start() {
    // Initialize logger
    if (!this.logger) {
      this.logger = new DatabaseLoggerService();
    }

    // Initialize Sequelize instance
    if (!this.sequelize) {
      const cfg = config.database[env];
      cfg.logging = this.logger.sequelizeLogger.bind(this.logger);
      const sequelize = new Sequelize(
        cfg.database,
        cfg.username,
        cfg.password,
        cfg
      );
      this.sequelize = sequelize;
    }

    // import all models from the models directory
    await importModels();
    // Add the imported models
    this.sequelize.addModels(models);

    this.started = true;
  }

  /**
   * Run a test to the connected database using Sequelize's `authenticate` API call.
   * On test failure, retry with exponential delay until test succeeds.
   * If the retry count exceeds the threshold set by `retryCountLimit`,
   * then retrying stops, and the test fails.
   *
   * @param initialDelay Time to wait before trying the test request
   * @returns Promise that resolves to `true` if test was successful,
   * and `false` otherwise.
   */
  private static async runTest(
    throws = false,
    initialDelay: number = this.retryDelayInitial
  ) {
    if (!this.sequelize) return false;

    // Test parameters
    let delay = initialDelay;
    const limit = this.retryCountLimit;

    for (let i = 0; i < limit; i++) {
      try {
        await this.sequelize.authenticate();
        // Test succeded. Clear errors and resolve to true
        this.testError = undefined;
        return true;
      } catch (error) {
        // Test failed
        this.testError = error;
        if (i < limit - 1) {
          // Wait before retrying
          await wait(delay);
          delay *= 2;
        } else {
          if (throws) throw error;
        }
      }
    }
    return false;
  }

  /**
   * Tests the connection to the database, and returns the result.
   * Any error that occured during testing can be accessed from the
   * static property `testError`.
   *
   * @returns Promise that resolves to `true` if test was successful,
   * and `false` otherwise.
   */
  public static async test(throws = false) {
    if (!this.sequelize) {
      this.connected = false;
    }

    // When test is called while another test is already in progress,
    // it will not create a new Promise, but just return the old one.
    if (!this.testPromise) {
      // Reset previous test results
      this.connected = undefined;
      this.testError = undefined;

      // Create a new Promise to run the test
      this.testPromise = this.runTest(throws);
    }

    // Wait for the test to finish
    this.connected = await this.testPromise;
    this.testPromise = undefined;
  }

  /**
   * Instance variable for easy access to the static sequelize property
   */
  sequelize: Sequelize;

  /**
   * Instance variable for easy access to the static sequelize property
   */
  logger: DatabaseLoggerService;

  get transaction() {
    return this.sequelize.transaction;
  }

  constructor() {
    super();
    if (!DatabaseService.started) {
      throw new Error('DatabaseService initialized before start');
    }

    this.logger = DatabaseService.logger as NonNullable<
      typeof DatabaseService['logger']
    >;
    this.sequelize = DatabaseService.sequelize as NonNullable<
      typeof DatabaseService['sequelize']
    >;
  }

  /**
   * Runs an action containing Sequelize database API calls with
   * proper error handling.
   * @param worker An async function containing the database query
   * @returns Return value of the worker function
   */
  public async run<T>(worker: () => Promise<T>) {
    if (DatabaseService.connected === undefined) {
      await DatabaseService.test();
    }

    if (DatabaseService.connected === false) {
      throw new SequelizeError(DatabaseService.testError);
    }

    try {
      return await worker();
    } catch (error) {
      if (error instanceof ServerError) {
        throw error;
      }
      throw new SequelizeError(error);
    }
  }
}
