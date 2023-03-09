import { DateTime } from 'luxon';

export function checkEnv(varnames: string | string[]) {
  if (typeof varnames === 'string') varnames = [varnames];
  const notSet = varnames.filter((varname) => !process.env[varname]);
  if (notSet.length > 0) {
    throw new Error(
      `Required environment variables not set: ${notSet.join(', ')}`
    );
  }
}

/**
 * Wait for a promise to fulfill only for a given amount of time
 * @param promise A Promise instance
 * @param time Max time to wait for promise
 * @param reject Reject the promise if it times out
 * @returns Resolved value, or null if it times out
 */
export function timeoutAfter<T>(
  promise: Promise<T>,
  time: number,
  options: { reject?: boolean } = {}
) {
  return Promise.race([
    promise,
    new Promise<null>((resolve, reject) => {
      setTimeout(() => (options.reject ? reject() : resolve(null)), time);
    }),
  ]);
}

/**
 * Wait for given amount of milliseconds asynchronously
 * @param timeMs Time to wait before resolving
 * @returns Promise that resolve after given timeout
 */
export function waitFor(timeMs: number) {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), timeMs));
}

/**
 * Generate delete suffix to add to unique columns in database
 * when soft-deleting rows
 * @returns Generated suffix
 */
export const getDeleteSuffix = () => {
  const d = DateTime.utc().toISO();
  return `${d}`;
};
