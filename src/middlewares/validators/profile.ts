import {
  body,
  CustomSanitizer,
  CustomValidator,
  param,
} from 'express-validator';
import isEmail from 'validator/lib/isEmail';
import normalizeEmail from 'validator/lib/normalizeEmail';

const isEmailOrEmpty: CustomValidator = (value) => {
  if (value === '') return true;
  return isEmail(value);
};

const normalizeEmailIfNotEmpty: CustomSanitizer = (value) => {
  if (value === '') return value;
  return normalizeEmail(value);
};

export const validateGetProfile = param('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .withMessage('NOT_INT');

export const requireProfileIdInParam = param('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .withMessage('NOT_INT');

export const requireProfileIdInBody = body('profileId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .withMessage('NOT_INT');

export const validateProfilePatch = [
  body('userId').optional().isEmpty().withMessage('UNKNOWN'),
  body('isPrimary').optional().isBoolean().withMessage('UNKNOWN'),
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
  body('team').optional().isInt().withMessage('NOT_INT'),
];
