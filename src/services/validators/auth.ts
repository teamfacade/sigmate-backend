import { body } from 'express-validator';

export const validateGoogleAuthCode = body('code')
  .notEmpty()
  .withMessage('ERR_REQUIRED');
