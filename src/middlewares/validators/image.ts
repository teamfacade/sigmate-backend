import { query } from 'express-validator';

export const validateCreateImage = query('folder')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isIn(['test', 'profile', 'category', 'forum', 'wiki'])
  .withMessage('INVALID_FOLDER_NAME');
