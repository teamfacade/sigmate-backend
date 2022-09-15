import { CustomSanitizer, CustomValidator } from 'express-validator';
import { MinMaxOptions } from 'express-validator/src/options';
import isEmail from 'validator/lib/isEmail';
import normalizeEmail from 'validator/lib/normalizeEmail';
import isLength from 'validator/lib/isLength';
import isEthereumAddress from 'validator/lib/isEthereumAddress';
import isURL from 'validator/lib/isURL';
import isInt from 'validator/lib/isInt';
import toInt from 'validator/lib/toInt';

export const isEmailOrEmpty: CustomValidator = (value) => {
  if (value === '') return true;
  return isEmail(value);
};

export const normalizeEmailIfNotEmpty: CustomSanitizer = (value) => {
  if (value === '') return value;
  return normalizeEmail(value, { gmail_remove_dots: false });
};

export const toDate: CustomSanitizer = (value) => {
  try {
    return new Date(value);
  } catch (error) {
    throw new Error('NOT_DATE');
  }
};

type RangeOptions = {
  min?: number;
  max?: number;
};

export const inRange = (options: RangeOptions): CustomValidator => {
  const inRangeValidator: CustomValidator = (value) => {
    const parsed = parseInt(value);
    if (isNaN(parsed)) throw new Error('NAN');
    const passedMin = options.min === undefined ? true : options.min <= parsed;
    const passedMax = options.max === undefined ? true : options.max >= parsed;
    if (passedMin && passedMax) return true;
    if (!passedMin) throw new Error('TOO_SMALL');
    throw new Error('TOO_BIG');
  };

  return inRangeValidator;
};

export const inMySQLIntRange = (
  { signed = true }: { signed: boolean } = { signed: true }
) => {
  const min = signed ? -2147483648 : 0;
  const max = signed ? 2147483647 : 4294967295;
  return inRange({ min, max });
};

export const isArrayItemsLength = (options: MinMaxOptions): CustomValidator => {
  const { min, max } = options;
  return (value) => {
    for (let i = 0; i < value.length; i++) {
      if (min !== undefined && value[i].length < min) return false;
      if (max !== undefined && value[i].length > max) return false;
    }
    return true;
  };
};

export const isPaymentTokensArray: CustomValidator = (value) => {
  if (value?.length === undefined) return false;
  for (let i = 0; i < value.length; i++) {
    const { name, symbol, address, imageUrl } = value[i];

    let { decimals } = value[i];

    const baseMsg = `paymentTokens[${i}]`;
    if (name) {
      let msg = `.name: `;
      if (!isLength(name, { min: 1, max: 191 })) {
        msg += 'TOO_LONG';
        throw new Error(baseMsg + msg);
      }
    }

    if (!symbol) {
      const msg = '.symbol: REQUIRED';
      throw new Error(baseMsg + msg);
    }

    if (address) {
      let msg = '.address: ';
      if (!isEthereumAddress(address)) {
        msg += 'INVALID_ETH_ADDR';
        throw new Error(baseMsg + msg);
      }
    }

    if (imageUrl) {
      let msg = '.imageUrl: ';
      if (!isURL(imageUrl)) {
        msg += 'NOT_URL';
        throw new Error(baseMsg + msg);
      }
    }

    if (decimals) {
      let msg = '.decimals: ';
      if (typeof decimals === 'string') {
        if (!isInt(decimals)) {
          msg += 'NOT_INT';
          throw new Error(baseMsg + msg);
        }
        decimals = toInt(decimals);
      }
    }
  }
  return true;
};

export const isCollectionDeployers: CustomValidator = (value) => {
  if (value?.length === undefined) return false;
  for (let i = 0; i < value.length; i++) {
    if (!isEthereumAddress(value[i])) {
      throw new Error('INVALID_ETH_ADDR');
    }
  }
  return true;
};
