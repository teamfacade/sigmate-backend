type EnvVarName = keyof NodeJS.ProcessEnv;

type CheckEnvOptions = {
  throws?: boolean;
};

export function checkEnv(varname: EnvVarName, options: CheckEnvOptions = {}) {
  const { throws = true } = options;
  const isEnvSet = process.env[varname] !== undefined;

  if (throws && !isEnvSet) {
    throw new Error(`Environment variable '${varname}' has not been set.`);
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
