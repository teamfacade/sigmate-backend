import { body, param } from 'express-validator';
import { isArrayItemsLength } from './utils';

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

export const validateGetForumPostsByCategory = [
  param('categoryId')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
];

export const validateGetForumPostById = param('postId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .withMessage('NOT_INT')
  .bail()
  .toInt();

export const validateUpdateForumPost = [
  param('postId')
    .trim()
    .escape()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('title')
    .optional()
    .trim()
    .stripLow()
    .bail()
    .isLength({ min: 1, max: 191 })
    .withMessage('LENGTH')
    .bail(),
  body('content')
    .optional()
    .trim()
    .stripLow()
    .bail()
    .isLength({ min: 1, max: 16383 })
    .withMessage('LENGTH'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('NOT_ARRAY')
    .bail()
    .custom(isArrayItemsLength({ min: 1, max: 191 }))
    .withMessage('LENGTH')
    .toArray(),
  body('tags')
    .optional()
    .isArray()
    .withMessage('NOT_ARRAY')
    .bail()
    .custom(isArrayItemsLength({ min: 1, max: 191 }))
    .withMessage('LENGTH')
    .toArray(),
];

export const validateCreateForumPost = [
  body('title')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 191 })
    .withMessage('LENGTH')
    .bail(),
  body('content')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 16383 })
    .withMessage('LENGTH'),
  body('categories')
    .isArray()
    .withMessage('NOT_ARRAY')
    .bail()
    .custom(isArrayItemsLength({ min: 1, max: 191 }))
    .withMessage('LENGTH')
    .toArray(),
  body('tags')
    .isArray()
    .withMessage('NOT_ARRAY')
    .bail()
    .custom(isArrayItemsLength({ min: 1, max: 191 }))
    .withMessage('LENGTH')
    .toArray(),
];

export const validateDeleteForumPost = param('postId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt()
  .withMessage('NOT_INT')
  .bail()
  .toInt();
