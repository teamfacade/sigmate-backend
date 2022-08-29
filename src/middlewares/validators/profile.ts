import { body, param } from 'express-validator';
import { USERNAME_MAX_LENGTH } from '../../models/User';
import { inMySQLIntRange, toInt } from './utils';

export const validateGetProfileByProfileId = param('profileId')
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

export const validateGetProfileByUserName = param('userName')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isLength({ min: 3, max: USERNAME_MAX_LENGTH })
  .withMessage('LENGTH')
  .bail();

export const validateProfilePatch = [
  body('displayName')
    .optional()
    .trim()
    .escape()
    .stripLow()
    .isLength({ max: 191 })
    .withMessage('TOO_LONG'),
  body('bio')
    .optional()
    .trim()
    .stripLow(true)
    .isByteLength({ max: 8000 })
    .withMessage('TOO_LONG'),
];
