import { CustomSanitizer, CustomValidator } from 'express-validator';
import { MinMaxOptions } from 'express-validator/src/options';
import isEmail from 'validator/lib/isEmail';
import normalizeEmail from 'validator/lib/normalizeEmail';

export const isEmailOrEmpty: CustomValidator = (value) => {
  if (value === '') return true;
  return isEmail(value);
};

export const normalizeEmailIfNotEmpty: CustomSanitizer = (value) => {
  if (value === '') return value;
  return normalizeEmail(value, { gmail_remove_dots: false });
};

export const toInt: CustomSanitizer = (value) => {
  const parsed = parseInt(value);
  if (isNaN(parsed)) return value;
  return parsed;
};

export const toBoolean: CustomSanitizer = (value) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  throw new Error('NOT_BOOLEAN');
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
