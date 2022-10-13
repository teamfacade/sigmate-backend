import { query } from 'express-validator';

export const validateSearchWikiDocument = query('q')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .isLength({ min: 3 })
  .withMessage('TOO_SHORT')
  .isLength({ max: 191 })
  .withMessage('TOO_LONG');
