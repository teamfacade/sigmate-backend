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
  body('discordUrl').optional().trim().stripLow(),
  body('discordChannel')
    .optional({ checkFalsy: true })
    .trim()
    .stripLow()
    .isNumeric()
    .withMessage('NOT_NUMERIC'),
  body('twitterHandle').optional().trim().stripLow(),
];
