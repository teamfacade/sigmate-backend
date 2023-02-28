import jwt from 'jsonwebtoken';
import { ValidationChain } from 'express-validator';

const MYSQL_LIMITS = {
  INT: { min: -2147483648, max: 2147483647 },
  UINT: { min: 0, max: 4294967295 },
  BIGINT: { min: -1 * 2 ** 63, max: 2 ** 63 - 1 },
  TEXT: { max: 2 ** 16 }, // 65536B, utf8mb4
  MEDIUMTEXT: { max: 2 ** 24 }, // 16777216B, utf8mb4
};

export type ValidationChainFactory = (
  chain: ValidationChain
) => ValidationChain;

export type ValidationChainNamesOf<T> = {
  [P in keyof T]: T[P] extends ValidationChain | ValidationChain[]
    ? P extends string
      ? P
      : never
    : never;
}[keyof T];

export type ValidationFactoryNamesOf<T> = {
  [P in keyof T]: T[P] extends ValidationChainFactory
    ? P extends string
      ? P
      : never
    : never;
}[keyof T];

type ValidatorNamesOf<T> =
  | ValidationChainNamesOf<T>
  | ValidationFactoryNamesOf<T>;

export default class ExpressValidator {
  static MYSQL_LIMITS = {
    INT: { min: -2147483648, max: 2147483647 },
    UINT: { min: 0, max: 4294967295 },
    BIGINT: { min: -1 * 2 ** 63, max: 2 ** 63 - 1 },
    TEXT: { max: 2 ** 16 }, // 65536B, utf8mb4
    MEDIUMTEXT: { max: 2 ** 24 }, // 16777216B, utf8mb4
  };

  static twitterHandle(chain: ValidationChain) {
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
  }
  static metamaskWallet(chain: ValidationChain) {
    return chain
      .trim()
      .stripLow()
      .isLength({ max: 64 })
      .withMessage('TOO_LONG')
      .isEthereumAddress()
      .withMessage('NOT_ETH_ADDRESS');
  }
  static jwt(chain: ValidationChain) {
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
  }
  static sqlInt(chain: ValidationChain, options: { unsigned?: boolean } = {}) {
    return chain
      .trim()
      .isInt(MYSQL_LIMITS[options.unsigned ? 'UINT' : 'INT'])
      .withMessage('NOT_INT')
      .bail()
      .toInt();
  }
  static sqlText(
    chain: ValidationChain,
    {
      encoding = 'utf8mb4',
      type = 'TEXT',
    }: { encoding?: string; type?: 'MEDIUMTEXT' | 'TEXT' } = {}
  ) {
    let { max } = MYSQL_LIMITS[type];
    if (encoding === 'utf8' || encoding === 'utf8mb4') max /= 4;
    max -= 1;
    return chain
      .trim()
      .stripLow(true)
      .isLength({ max })
      .withMessage('TOO_LONG');
  }
}

export function getValidator<V extends typeof ExpressValidator>(
  validator: V,
  name: ValidatorNamesOf<V>
) {
  return validator[name];
}

export function getValiadtionFactory<V extends typeof ExpressValidator>(
  validator: V,
  name: ValidationFactoryNamesOf<V>
) {
  return validator[name];
}

export function getValidationChain<V extends typeof ExpressValidator>(
  validator: V,
  name: ValidationChainNamesOf<V>
) {
  return validator[name];
}
