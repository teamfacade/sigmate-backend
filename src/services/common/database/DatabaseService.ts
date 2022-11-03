import { Sequelize } from 'sequelize-typescript';
import config from '../../../config';
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

  /**
   * Instance variable for easy access to the static sequelize property
   */
  sequelize: Sequelize;

  /**
   * Instance variable for easy access to the static sequelize property
   */
  logger: DatabaseLoggerService;

  // Connection test related properties
  /** Initial retry delay on bad DB connection (milliseconds) */
  retryDelayInitial = 200;
  /** Number of times to retry the database test */
  retryCountLimit = 5;

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
  connected?: boolean;
  /**
   * A promise that runs the connection test. Resolves to a boolean value
   * containing the test result.
   *
   * @returns `true` on test success, `false` on failure
   */
  testPromise?: Promise<boolean>;
  /** Error object thrown during the last connection test */
  testError?: unknown;

  constructor() {
    super();

    // Initialize logger
    if (!DatabaseService.logger) {
      DatabaseService.logger = new DatabaseLoggerService(this);
    }
    this.logger = DatabaseService.logger;

    // Ensure only one instance is intialized per process
    if (!DatabaseService.sequelize) {
      let sequelize: Sequelize = undefined as unknown as Sequelize;
      const sequelizeConfig = config.database[env];
      sequelizeConfig.logging = this.logger.sequelizeLogger.bind(this.logger);

      try {
        sequelize = new Sequelize(
          sequelizeConfig.database,
          sequelizeConfig.username,
          sequelizeConfig.password,
          sequelizeConfig
        );
      } catch (error) {
        throw new SequelizeError(error);
      }

      this.sequelize = sequelize;
      DatabaseService.sequelize = sequelize;
    } else {
      this.sequelize = DatabaseService.sequelize;
    }
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
  private async runTest(
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
  public async test(throws = false) {
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
   * Runs an action containing Sequelize database API calls with
   * proper error handling.
   * @param worker An async function containing the database query
   * @returns Return value of the worker function
   */
  public async run<T>(worker: () => Promise<T>) {
    if (this.connected === undefined) {
      await this.test();
    }

    if (this.connected === false) {
      throw new SequelizeError(this.testError);
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
