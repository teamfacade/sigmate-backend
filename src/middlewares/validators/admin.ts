import { body } from 'express-validator';

export const validateConfirm = [
  body('collectionId')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('discordChannel').trim().stripLow().bail(),
  body('twitterChannel').trim().stripLow().bail(),
  body('twitterHandle').trim().stripLow().bail(),
];
