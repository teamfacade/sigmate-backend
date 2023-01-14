import { ValidationChain } from 'express-validator';
import jwt from 'jsonwebtoken';

type ValidatorName =
  | 'twitterHandle'
  | 'metamaskWallet'
  | 'jwt'
  | 'sql/text'
  | 'sql/int';

const MYSQL_LIMITS = {
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

const getValidationChain = (
  name: ValidatorName,
  chain: ValidationChain
): ValidationChain => {
  switch (name) {
    case 'twitterHandle':
      return chain
        .trim()
        .stripLow()
        .customSanitizer((value) => {
          // Remove @ symbol if exists
          if (value?.length && value[0] === '@') {
            return value.slice(1);
          }
          return value;
        })
        .isLength({ max: 16 })
        .withMessage('TOO_LONG')
        .isAlphanumeric('en-US', { ignore: '_' })
        .withMessage('NOT_ALPHANUMERIC');
    case 'metamaskWallet':
      return chain
        .trim()
        .stripLow()
        .isLength({ max: 64 })
        .withMessage('TOO_LONG')
        .isEthereumAddress()
        .withMessage('NOT_ETH_ADDRESS');
    case 'jwt':
      return chain
        .trim()
        .notEmpty()
        .withMessage('REQUIRED')
        .custom((value) => {
          const payload = jwt.decode(value);
          if (!payload) {
            throw new Error('INVALID_JWT');
          }
          if (payload instanceof Object) {
            if (!Object.keys(payload).length) {
              throw new Error('INVALID_JWT');
            }
          }
          return true;
        });
    case 'sql/text':
      return chain
        .trim()
        .stripLow(true)
        .isLength({ max: MYSQL_LIMITS.TEXT.max })
        .withMessage('TOO_LONG');
    case 'sql/int':
      return chain
        .trim()
        .isInt(MYSQL_LIMITS.INT)
        .withMessage('NOT_INT')
        .bail()
        .toInt();
    default:
      throw new Error(`Validator '${name}' does not exist`);
  }
};

export default getValidationChain;
