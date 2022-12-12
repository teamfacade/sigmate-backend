import { ConnectionError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import Service from './Service';
import config from '../config';
import { models, importModels } from '../models';
import DatabaseError from './errors/DatabaseError';
import { wait } from '../utils';
import Logger from './logger';

export default class Database extends Service {
  static sequelize: Sequelize = undefined as unknown as Sequelize;
  static get transaction() {
    return this.sequelize.transaction;
  }

  static TEST_DELAY_INIT = 400;
  static TEST_DELAY_ON_FAIL = 5 * 60 * 1000; // 5 minutes
  static TEST_MAX_RETRIES = 12;

  // Results of different test phases
  private static initialized = false;
  private static modelsAdded = false;
  private static __connected = false;

  /**
   * Check whether the database is available for query calls
   */
  static get connected() {
    return Database.initialized && Database.modelsAdded && Database.__connected;
  }

  private static testPromise: Promise<void> | undefined = undefined;

  /**
   * Connect to the database by initializing a Sequelize instance
   * On success, set the `Database.initialized` property to true
   */
  private static connect() {
    if (Database.sequelize) return;
    const env = process.env.NODE_ENV;
    const { database, username, password } = config.database[env];

    // This connects to the database server
    // Throws an error on failure, which will be handled in the __test() method
    Database.sequelize = new Sequelize(
      database,
      username,
      password,
      config.database[env]
    );
    Database.initialized = true;
  }

  /**
   * Import the defined model definitions from the `models` directory
   * and call the `sequelize.addModels()` method.
   * Errors thrown here will be handled in the `__test()` method
   *
   * On success, set the `Database.modelsAdded` property to true
   */
  private static async addModels() {
    if (Database.sequelize) {
      await importModels();
      Database.sequelize.addModels(models);
      Database.modelsAdded = true;
    }
  }

  /**
   * Test the connection with the `sequelize.authenticate()` call.
   * On success, set the `Database.__connected` property to `true`
   * Errors thrown here will be handled in the `__test()` method
   */
  private static async authenticate() {
    await Database.sequelize?.authenticate();
    Database.__connected = true;
  }

  name = 'DATABASE';
  logger?: Logger;
  get serviceStatus() {
    return Database.status;
  }
  get sequelize() {
    return Database.sequelize;
  }

  constructor(options: { checkStart?: boolean } = {}) {
    super();
    const { checkStart = true } = options;
    if (!Database.started && checkStart) {
      throw new DatabaseError({ code: 'SERVICE/INIT_BEFORE_START' });
    }
    this.logger = Database.logger;
  }

  /**
   * Connect to the database and test the connection
   */
  async start() {
    // If already started, no need to do it again
    if (Database.started) return;

    // Log service starting
    Database.status = Database.STATE.STARTING;
    this.logger?.log({ service: this });

    await this.test();

    Database.status = Database.STATE.STARTED;
    this.logger?.log({ service: this });
  }

  /**
   * Run tests with exponentially incrementing delay for a certain number of times
   * before giving up.
   */
  private async __test() {
    Database.__connected = false;

    // Current retry count of this test
    let retries = 0;
    // Delay to wait between each test attempt
    let delay = Database.TEST_DELAY_INIT;
    // Whether to fail the server on error
    let critical = false;
    // Attempt the test
    while (retries <= Database.TEST_MAX_RETRIES) {
      retries += 1;
      try {
        if (!Database.initialized) {
          Database.connect();
        }

        try {
          if (!Database.modelsAdded) {
            await Database.addModels();
          }
        } catch (error) {
          // If this fails, fail the server without retrying
          critical = true;
          throw error;
        }

        if (!Database.__connected) {
          await Database.authenticate();
        }

        break;
      } catch (error) {
        // Log the error
        const dbError = new DatabaseError({
          code: 'DB/ER_TEST_ATTEMPT',
          message: `(${retries}/${Database.TEST_MAX_RETRIES})`,
          error,
          critical,
        });
        this.logger?.log({ error: dbError });

        // If database is closing, stop testing
        if (critical || Database.closed) break;

        // Wait test delay
        await wait(delay);
        // Increase test delay
        delay *= 2;
      }
    }

    if (!Database.connected) {
      // Final test fail. Throw
      throw new DatabaseError({ code: 'DB/ER_TEST', critical });
    }
  }

  /**
   * Ensure that only one test runs
   */
  public async test(handleFail = true) {
    // Ensure only one test runs at any given moment
    if (!Database.testPromise) {
      Database.testPromise = this.__test();
    }
    try {
      // Wait for the test to complete
      await Database.testPromise;
      Database.testPromise = undefined;
    } catch (error) {
      // If we reached here, the final attempt of the test has failed.
      // So stop retrying, and handle the error

      Database.testPromise = undefined;
      // Should the service retry connecting?
      let retry = true;
      if (error instanceof DatabaseError) {
        if (error.critical) {
          // For critical errors, don't retry
          // and fail the server
          retry = false;
        }
      }
      // If this method was called from within the onFail method,
      // onFail should not be called again

      // Note that the onFail method is not awaited, even though
      // it is an async function. This is to prevent the run()
      // method for waiting the test to run, causing the user's
      // request to hang.
      if (handleFail) this.onFail(retry);

      // Caller should know that the test finally failed
      throw error;
    }
  }

  /**
   * Run a function containing database query call(s)
   * @param worker Function containing the database query call
   * @returns Return value of worker
   */
  public async run<T>(worker: () => Promise<T>) {
    // User request fails with 503 if service is unavailable
    if (Database.closed) throw new DatabaseError({ code: 'DB/NA_CLOSED' });
    if (Database.failed) throw new DatabaseError({ code: 'DB/NA_FAILED' });
    if (!Database.connected) await this.test();

    try {
      return await worker();
    } catch (error) {
      const err = new DatabaseError({ code: 'DB/ER_RUN', error });
      if (err instanceof ConnectionError) {
        Database.__connected = false;
        // Start the test, but don't wait for it, so that the user's
        // request won't hang
        this.test();
      }
      throw err;
    }
  }

  /**
   * On service failure, log the error and retry the test.
   *
   * **<CAUTION>** This method retries **infinitely** until database
   * connection succeeds. Use with caution when awaiting this method.
   * @param retry Flag to perform the test or not
   */
  private async onFail(retry: boolean) {
    if (Database.failed) return;
    Database.status = Database.STATE.FAILED;
    this.logger?.log({ service: this });

    // Infinitely retry until connection succes
    while (!Database.initialized && retry) {
      await this.test(false);
      await wait(Database.TEST_DELAY_ON_FAIL);
      if (Database.closed) {
        // Stop retrying on the close() call
        break;
      }
    }

    // If we succeded the test, make the service available again
    if (Database.connected) {
      Database.status = Database.STATE.STARTED;
      this.logger?.log({ service: this });
    }
  }

  /**
   * Close the DB connection and prevent any more `run()` calls
   */
  public async close() {
    if (!Database.started || Database.closed) return;
    Database.status = Database.STATE.CLOSING;
    this.logger?.log({ service: this });

    // Wait for the current test to finish (if any)
    if (Database.testPromise) {
      await this.test(false);
    }

    try {
      // Close connection with database
      await Database.sequelize?.close();
    } catch (error) {
      // Log the error, but don't fail
      this.logger?.log({ error });
    } finally {
      // Cloes calls should fail silently
      Database.status = Database.STATE.CLOSED;
      this.logger?.log({ service: this });
    }
  }
}
