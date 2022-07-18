import { body } from 'express-validator';

export const validateGoogleAuthCode = body('code')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('ERR_OAUTH_GOOGLE')
  .bail()
  .isLength({ max: 128 })
  .withMessage('ERR_OAUTH_GOOGLE')
  .isString()
  .bail()
  .withMessage('ERR_OAUTH_GOOGLE')
  .bail();
