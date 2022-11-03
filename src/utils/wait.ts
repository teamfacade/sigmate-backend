/**
 * Returns a Promise that resolves after a given amount of time
 * @param time Number of milliseconds to wait before resolving the Promise
 */
export default function wait(time: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), time);
  });
}

/**
 * Wait for a promise to fulfill only for a given amount of time
 * @param promise A Promise instance
 * @param time Max time to wait for promise
 * @returns Resolved value, or void if it times out
 */
export function waitTimeout<T>(promise: Promise<T>, time: number) {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => {
      setTimeout(() => resolve(), time);
    }),
  ]);
}
