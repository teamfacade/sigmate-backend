import { ValidationChain } from 'express-validator';
import jwt from 'jsonwebtoken';

type ValidatorName =
  | 'twitterHandle'
  | 'metamaskWallet'
  | 'jwt'
  | 'sql/text'
  | 'sql/int';

export const MYSQL_TEXT_MAX_LENGTH = 16383;

const MYSQL_LIMITS = {
  INT: { min: -2147483648, max: 2147483647 },
  TEXT: { max: 16383 },
  BIGINT: { min: -1 * 2 ** 63, max: 2 ** 63 - 1 },
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
        .isLength({ max: MYSQL_TEXT_MAX_LENGTH })
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
