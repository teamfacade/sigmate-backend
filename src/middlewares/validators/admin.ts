import { body } from 'express-validator';

export const validateConfirm = [
  body('collectionId')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .isInt()
    .withMessage('NOT_INT')
    .toInt(),
  body('discordChannel')
    .trim()
    .stripLow()
    .isNumeric()
    .withMessage('NOT_NUMERIC'),
  body('twitterChannel')
    .trim()
    .stripLow()
    .isNumeric()
    .withMessage('NOT_NUMERIC'),
  body('twitterHandle').trim().stripLow(),
];
