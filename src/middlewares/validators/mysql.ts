export default class MySqlValidators {
  static LIMITS = {
    INT: { min: -2147483648, max: 2147483647 },
    UINT: { min: 0, max: 4294967295 },
    BIGINT: { min: -1 * 2 ** 63, max: 2 ** 63 - 1 },
    TEXT: { max: 16383 }, // utf8mb4
    MEDIUMTEXT: { max: 4194302 }, // utf8mb4
  };
}
