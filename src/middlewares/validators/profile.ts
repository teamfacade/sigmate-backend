import { body, param } from 'express-validator';
import { inMySQLIntRange, toBoolean, toInt } from './utils';

export const validateGetProfile = param('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .custom(inMySQLIntRange())
  .withMessage('NOT_INT')
  .bail()
  .customSanitizer(toInt);

export const requireProfileIdInParam = param('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .custom(inMySQLIntRange())
  .withMessage('NOT_INT')
  .bail()
  .customSanitizer(toInt);

export const requireProfileIdInBody = body('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .custom(inMySQLIntRange())
  .withMessage('NOT_INT')
  .bail()
  .customSanitizer(toInt);

const validateProfileOptionalFields = [
  body('userId').optional().isEmpty().withMessage('UNKNOWN'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .customSanitizer(toBoolean),
  body('displayName')
    .optional()
    .trim()
    .escape()
    .stripLow()
    .isLength({ max: 128 })
    .withMessage('TOO_LONG'),
  body('picture').optional().isEmpty().withMessage('UNKNOWN'),
  body('bio')
    .optional()
    .trim()
    .stripLow(true)
    .isByteLength({ max: 65535 })
    .withMessage('TOO_LONG'),
  body('team')
    .optional()
    .isInt()
    .custom(inMySQLIntRange())
    .withMessage('NOT_INT')
    .bail()
    .customSanitizer(toInt),
];

export const validateProfilePost = [
  param('profileId').optional().isEmpty().withMessage('UNKNOWN'),
  body('profileId').optional().isEmpty().withMessage('UNKNOWN'),
  ...validateProfileOptionalFields,
];

export const validateProfilePatch = [
  param('profileId')
    .optional()
    .isInt()
    .custom(inMySQLIntRange())
    .withMessage('NOT_INT')
    .bail()
    .customSanitizer(toInt),
  body('profileId')
    .optional()
    .isInt()
    .custom(inMySQLIntRange())
    .withMessage('NOT_INT')
    .bail()
    .customSanitizer(toInt),
  ...validateProfileOptionalFields,
];

export const validateProfileDeleteParams = param('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .custom(inMySQLIntRange())
  .withMessage('NOT_INT')
  .bail()
  .customSanitizer(toInt);

export const validateProfileDeleteBody = body('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .custom(inMySQLIntRange())
  .withMessage('NOT_INT')
  .bail()
  .customSanitizer(toInt);
