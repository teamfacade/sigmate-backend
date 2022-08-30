import { body } from 'express-validator';

export const validateCreateCategory = [
  body('name')
    .trim()
    .stripLow()
    .escape()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 191 })
    .withMessage('LENGTH')
    .bail(),
  body('description')
    .trim()
    .stripLow()
    .isLength({ min: 0, max: 255 })
    .withMessage('LENGTH')
    .bail(),
];

export const validateUpdateCategory = [
  body('name')
    .optional()
    .trim()
    .stripLow()
    .escape()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 191 })
    .withMessage('LENGTH')
    .bail(),
  body('description')
    .optional()
    .trim()
    .stripLow()
    .isLength({ min: 0, max: 255 })
    .withMessage('LENGTH')
    .bail(),
];

export const validateDeleteCategory = [
  body('id')
    .optional()
    .trim()
    .stripLow()
    .escape()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('name')
    .optional()
    .trim()
    .stripLow()
    .escape()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 191 })
    .withMessage('LENGTH'),
];
