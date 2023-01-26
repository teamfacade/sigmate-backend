import { DateTime } from 'luxon';
import ServerError from '../services/errors/ServerError';

type EnvVarName = keyof NodeJS.ProcessEnv;

type CheckEnvOptions = {
  /**
   * Array of the names of the environment variables that are not set
   */
  notSetArray?: (string | number)[];
};

export function isEnvVarSet(
  varname: EnvVarName,
  options: CheckEnvOptions = {}
) {
  const isEnvSet = process.env[varname] !== undefined;
  if (!isEnvSet && options.notSetArray) {
    options.notSetArray.push(varname);
  }
  return isEnvSet;
}

/**
 * Returns a Promise that resolves after a given amount of time
 * @param time Number of milliseconds to wait before resolving the Promise
 */
export function wait(time: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), time);
  });
}

/**
 * Wait for a promise to fulfill only for a given amount of time
 * @param promise A Promise instance
 * @param time Max time to wait for promise
 * @returns Resolved value, or null if it times out
 */
export function waitTimeout<T>(promise: Promise<T>, time: number) {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), time);
    }),
  ]);
}

export const isEnv = (env: typeof process.env.NODE_ENV) => {
  return process.env.NODE_ENV === env;
};

/**
 * Clean unnecessary whitespaces (trim, remove newlines, consecutive whitespaces)
 * @param string string to clean
 * @returns Cleaned string
 */
export const cleanWs = (string: string) => {
  const nl = /[\n\t]/g; // Newlines and tabs
  const ws = /\s{2,}/g; // Consecutive whitespaces
  return string.trim().replace(nl, ' ').replace(ws, ' ');
};

/**
 * Generate delete suffix to add to unique columns in database
 * when soft-deleting rows
 * @returns Generated suffix
 */
export const getDeleteSuffix = () => {
  const d = DateTime.utc().toISO();
  return `${d}`;
};

/**
 * Generate an UnsignedByteArray to use as the input for the
 * `ip-address` package's `Address6.fromUnsignedByteArray()`
 * @param value 128 bit zero-padded binary string representation of a valid IPv6 address
 * @returns UnsignedByteArray
 */
export function getUnsignedByteArray(value: string) {
  let i = 0;
  const byteArray: number[] = [];
  while (i < value.length) {
    byteArray.push(Number.parseInt(value.slice(i, i + 8), 2));
    i += 8;
  }
  return byteArray;
}

type RetryOptions = {
  /** Stop retrying after given number of attempts */
  maxAttempts?: number;
  /** Delay to wait between each attempts */
  delayMs: number;
  /** Delay does not increase more than this value */
  delayMaxMs?: number;
  /** Increase delay by fixed value */
  delayIncMs?: number;
  /** Increase delay exponentially (multiply 2) */
  delayIncExp?: boolean;
  /** Function to run for each failed attempts */
  onFail?: (error: unknown, attempt: number) => unknown;
  /** Function to decide whether to stop retrying immediately. Overrides `stopOnCriticalErrors`. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Stop retrying when a 'critical' ServerError is thrown. Overriden by `shouldRetry`. */
  stopOnCriticalErrors?: boolean;
};

export type RetryReturnType<T = unknown> = {
  success: boolean;
  data?: T;
  error?: unknown;
};

/**
 * Retry a certain task until it succeeds.
 * @param task Task to retry. Must throw an error to retry.
 * @param options Retry options
 * @returns Return value of task
 */
export const retry = async <T>(
  task: () => Promise<T>,
  options: RetryOptions
): Promise<RetryReturnType<T>> => {
  let success = false;
  let data: T | undefined = undefined;
  let error: unknown = undefined;
  const {
    maxAttempts,
    delayMs,
    delayMaxMs,
    delayIncMs,
    delayIncExp,
    onFail,
    shouldRetry,
    stopOnCriticalErrors = true,
  } = options;

  if (maxAttempts && maxAttempts < 2) {
    throw new Error('retry: maxAttempts must be larger than 1');
  }

  if (delayMs < 0) {
    throw new Error('retry: delayMs must be larger than 0');
  }

  if (delayMaxMs && delayMaxMs < delayMs) {
    throw new Error('retry: delayMaxMs must be larger than delayMs');
  }

  if (delayIncMs && delayIncExp) {
    throw new Error('retry: set one of delayIncMs or delayIncExp');
  }

  if (delayIncMs && delayIncMs < 0) {
    throw new Error('retry: delayIncMs must be larger than 0');
  }

  let attempt = 0;
  let delay = delayMs;
  let increaseDelay = Boolean(delayIncMs || delayIncExp);
  while (!success) {
    try {
      data = await task();
      success = true;
      break;
    } catch (err) {
      attempt++;
      error = err; // To return to caller

      // Run the fail hook
      if (onFail) onFail(err, attempt);

      // Decide whether to continue trying
      if (shouldRetry !== undefined) {
        if (!shouldRetry(err, attempt)) {
          break;
        }
      } else if (stopOnCriticalErrors) {
        // By default, stop on 'critical' errors
        if (err instanceof ServerError) {
          if (err.critical) break;
        }
      }

      // Try up to maxAttempts
      if (maxAttempts && attempt >= maxAttempts) {
        break;
      }

      // Prevent integer issues on infinite retry
      if (attempt + 1 < Number.MAX_SAFE_INTEGER) {
        break;
      }

      // Wait the delay
      await wait(delay);

      // Increase the delay
      if (increaseDelay) {
        let newDelay = delay;
        if (delayIncMs) {
          newDelay += delayIncMs;
        } else if (delayIncExp) {
          newDelay *= 2;
        }
        if (delayMaxMs && newDelay > delayMaxMs) {
          newDelay = delay;
          increaseDelay = false;
        }
        delay = newDelay;
      }
    }
  }

  return { success, data, error };
};
