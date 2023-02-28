export const MYSQL_LIMITS = {
  INT: { min: -2147483648, max: 2147483647 },
  UINT: { min: 0, max: 4294967295 },
  BIGINT: { min: -1 * 2 ** 63, max: 2 ** 63 - 1 },
  TEXT: { max: 16383 }, // utf8mb4
  MEDIUMTEXT: { max: 4194302 }, // utf8mb4
};

export const MYSQL_VALIDATORS = {
  INT: (value: unknown) => {
    if (typeof value !== 'number') throw new Error('NOT_INT');
    if (value > MYSQL_LIMITS.INT.max || value < MYSQL_LIMITS.INT.min) {
      throw new Error('INT_OUT_OF_RANGE');
    }
    return true;
  },
  UINT: (value: unknown) => {
    if (typeof value !== 'number') throw new Error('NOT_INT');
    if (value > MYSQL_LIMITS.UINT.max || value < MYSQL_LIMITS.UINT.min) {
      throw new Error('UINT_OUT_OF_RANGE');
    }
    return true;
  },
  TEXT: (value: unknown) => {
    if (typeof value !== 'string') throw new Error('NOT_STRING');
    if (value.length > MYSQL_LIMITS.TEXT.max) {
      throw new Error('TOO_LONG');
    }
  },
  MEDIUMTEXT: (value: unknown) => {
    if (typeof value !== 'string') throw new Error('NOT_STRING');
    if (value.length > MYSQL_LIMITS.MEDIUMTEXT.max) {
      throw new Error('TOO_LONG');
    }
  },
};
