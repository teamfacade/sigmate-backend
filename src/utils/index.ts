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
  const d = Date.now().toString();
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
