import { body, param } from 'express-validator';
import {
  isEmailOrEmpty,
  normalizeEmailIfNotEmpty,
  toBoolean,
  toInt,
} from './utils';

export const validateGetProfile = param('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .withMessage('NOT_INT')
  .customSanitizer(toInt);

export const requireProfileIdInParam = param('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .withMessage('NOT_INT')
  .customSanitizer(toInt);

export const requireProfileIdInBody = body('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .withMessage('NOT_INT')
  .customSanitizer(toInt);

const validateProfileOptionalFields = [
  body('userId').optional().isEmpty().withMessage('UNKNOWN'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .customSanitizer(toBoolean),
  body('displayName')
    .optional()
    .trim()
    .escape()
    .stripLow()
    .isLength({ max: 128 })
    .withMessage('TOO_LONG'),
  body('displayEmail')
    .optional()
    .trim()
    .escape()
    .stripLow()
    .custom(isEmailOrEmpty)
    .withMessage('NOT_EMAIL')
    .customSanitizer(normalizeEmailIfNotEmpty),
  body('displayEmailVerified').optional().isEmpty().withMessage('UNKNOWN'),
  body('picture').optional().isEmpty().withMessage('UNKNOWN'),
  body('bio')
    .optional()
    .trim()
    .stripLow(true)
    .isByteLength({ max: 65535 })
    .withMessage('TOO_LONG'),
  body('organization').optional().trim().stripLow().isLength({ max: 128 }),
  body('websiteUrl')
    .optional()
    .trim()
    .escape()
    .stripLow()
    .isURL()
    .withMessage('NOT_URL'),
  body('googleAccount')
    .optional()
    .trim()
    .escape()
    .stripLow()
    .isEmail()
    .withMessage('NOT_EMAIL'),
  body('googleAccountId').optional().isEmpty().withMessage('UNKNOWN'),
  body('twitterHandle')
    .optional()
    .trim()
    .escape()
    .stripLow()
    .isLength({ max: 16 })
    .withMessage('TOO_LONG'),
  body('twitterVerified').optional().isEmpty().withMessage('UNKNOWN'),
  body('discordInviteCode')
    .optional()
    .trim()
    .escape()
    .stripLow()
    .isLength({ max: 64 })
    .withMessage('TOO_LONG'),
  body('discordInviteCode')
    .optional()
    .trim()
    .escape()
    .stripLow()
    .isLength({ max: 16 })
    .withMessage('TOO_LONG'),
  body('discordVerified').optional().isEmpty().withMessage('UNKNOWN'),
  body('team').optional().isInt().withMessage('NOT_INT').customSanitizer(toInt),
];

export const validateProfilePost = [
  param('profileId').optional().isEmpty().withMessage('UNKNOWN'),
  body('profileId').optional().isEmpty().withMessage('UNKNOWN'),
  ...validateProfileOptionalFields,
];

export const validateProfilePatch = [
  param('profileId').optional().isInt().withMessage('UNKNOWN'),
  body('profileId').optional().isInt().withMessage('UNKNOWN'),
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
  .withMessage('NOT_INT')
  .customSanitizer(toInt);

export const validateProfileDeleteBody = body('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .withMessage('NOT_INT')
  .customSanitizer(toInt);
