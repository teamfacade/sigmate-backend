import { query } from 'express-validator';

export const validateGetRecentEdits = [
  query('document')
    .optional()
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
];
