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
  param('id')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
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
    .custom((value) => {
      if (value.length === undefined) throw new Error('NOT_ARRAY');
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] !== 'number') {
          throw new Error('NOT_INT');
        }
      }
      return true;
    })
    .toArray(),
  body('tags')
    .optional()
    .isArray()
    .withMessage('NOT_ARRAY')
    .bail()
    .custom(isArrayItemsLength({ min: 0, max: 191 }))
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
  body('categories').isArray().withMessage('NOT_ARRAY').toArray(),
  body('categories.*')
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('NOT_INT'),
  body('tags').optional().isArray().toArray(),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 191 })
    .withMessage('LENGTH'),
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

export const validateVoteForumPost = [
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
  body('like')
    .trim()
    .escape()
    .stripLow()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
];

export const validateGetMyForumPostVote = param('postId')
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

export const validateDeleteMyForumPostVote = param('postId')
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

export const validateGetForumPostComments = param('postId')
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

export const validateGetForumPostCommentReplies = param('commentId')
  .trim()
  .escape()
  .stripLow()
  .notEmpty()
  .isInt()
  .withMessage('NOT_INT')
  .bail()
  .toInt();

export const validateCreateForumPostComment = [
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
  body('content')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 16383 })
    .withMessage('LENGTH')
    .bail(),
  body('parentId').optional().isInt().withMessage('NOT_INT').bail().toInt(),
];

export const validateUpdateForumPostComment = [
  param('commentId')
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
  body('content')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 16383 })
    .withMessage('LENGTH')
    .bail(),
];

export const validateDeleteForumPostComment = [
  param('commentId')
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
];

export const validateVoteForumComment = [
  param('commentId')
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
  body('like')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
];

export const validateDeleteForumCommentVote = [
  param('commentId')
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
];
