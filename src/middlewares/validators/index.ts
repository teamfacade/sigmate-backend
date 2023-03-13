import { RequestHandler } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import RequestError from '../../errors/request';

export type ValidatorFactory = (chain: ValidationChain) => ValidationChain;

export default class BaseValidator {
  static MYSQL_LIMITS = {
    INT: { min: -2147483648, max: 2147483647 },
    UINT: { min: 0, max: 4294967295 },
    BIGINT: { min: -1 * 2 ** 63, max: 2 ** 63 - 1 },
    TEXT: { max: 16383 }, // utf8mb4
    MEDIUMTEXT: { max: 4194302 }, // utf8mb4
  };
}

const handleBadRequest: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    next();
  } else {
    const validationErrors = errors.array();
    next(
      new RequestError({
        code: 'REQ/IV',
        validationErrors,
      })
    );
  }
};

export function RequestValidator(
  target: any,
  key: string,
  desc?: PropertyDescriptor
) {
  const validator = desc?.value || target[key];
  const controllers: RequestHandler[] = [];
  if (validator instanceof Array) {
    controllers.concat(validator);
  } else {
    controllers.push(validator);
  }
  controllers.push(handleBadRequest);
  desc?.value ? (desc.value = controllers) : (target[key] = controllers);
}
