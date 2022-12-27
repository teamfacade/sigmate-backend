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
