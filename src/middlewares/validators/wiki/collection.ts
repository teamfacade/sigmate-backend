import { body, query, param } from 'express-validator';
import { isCollectionDeployers, isPaymentTokensArray } from '../utils';

export const validateGetCollectionBySlug = [
  query('create')
    .optional()
    .trim()
    .stripLow()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
  query('update')
    .optional()
    .trim()
    .stripLow()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
  param('slug').trim().stripLow().notEmpty().withMessage('REQUIRED'),
];

export const validateCreateCollection = [
  body('contractAddress')
    .optional()
    .trim()
    .stripLow()
    .isEthereumAddress()
    .withMessage('INVALID_ETH_ADDR')
    .bail(),
  body('collectionDeployers')
    .optional()
    .isArray()
    .custom(isCollectionDeployers)
    .toArray(),
  body('slug')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 191 })
    .withMessage('TOO_LONG'),
  body('name')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 191 })
    .withMessage('TOO_LONG'),
  body('description')
    .optional()
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 16383 })
    .withMessage('TOO_LONG')
    .bail(),
  body('paymentTokens')
    .optional()
    .isArray()
    .custom(isPaymentTokensArray)
    .toArray(),
  body('contractSchema')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 16 })
    .withMessage('TOO_LONG')
    .bail(),
  body('email')
    .optional()
    .trim()
    .stripLow()
    .isEmail()
    .withMessage('NOT_EMAIL')
    .bail(),
  body('blogUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL()
    .withMessage('NOT_URL')
    .bail()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG')
    .bail(),
  body('redditUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL()
    .withMessage('NOT_URL')
    .bail()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG')
    .bail(),
  body('facebookUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL()
    .withMessage('NOT_URL')
    .bail()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG')
    .bail(),
  body('twitterHandle')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 16 })
    .withMessage('TOO_LONG')
    .bail(),
  body('discordUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('websiteUrl')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isURL()
    .withMessage('NOT_URL')
    .bail()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('telegramUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('bitcointalkUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('githubUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('wechatUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('linkedInUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('whitepaperUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('imageUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL()
    .withMessage('NOT_URL')
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('bannerImageUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL()
    .withMessage('NOT_URL')
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('mintingPriceWl')
    .optional()
    .trim()
    .stripLow()
    .isFloat()
    .withMessage('NOT_FLOAT'),
  body('mintingPricePublic')
    .optional()
    .trim()
    .stripLow()
    .isFloat()
    .withMessage('NOT_FLOAT'),
  body('floorPrice')
    .optional()
    .trim()
    .stripLow()
    .isFloat()
    .withMessage('NOT_FLOAT'),
  body('document')
    .optional()
    .trim()
    .stripLow()
    .isInt()
    .withMessage('NOT_INT')
    .toInt(),
  body('marketplace')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 191 })
    .withMessage('TOO_LONG')
    .bail(),
  body('category')
    .optional()
    .trim()
    .stripLow()
    .isLength({ min: 1, max: 64 })
    .withMessage('TOO_LONG')
    .bail(),
  body('utility')
    .optional()
    .trim()
    .stripLow()
    .isLength({ min: 1, max: 64 })
    .withMessage('TOO_LONG')
    .bail(),
  body('team')
    .optional()
    .trim()
    .stripLow()
    .isLength({ min: 1, max: 16383 })
    .withMessage('TOO_LONG')
    .bail(),
  body('history')
    .optional()
    .trim()
    .stripLow()
    .isLength({ min: 1, max: 16383 })
    .withMessage('TOO_LONG')
    .bail(),
];

export const validateUpdateCollection = [
  param('slug')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 191 })
    .withMessage('TOO_LONG')
    .bail(),
  body('contractAddress')
    .optional()
    .trim()
    .stripLow()
    .isEthereumAddress()
    .withMessage('INVALID_ETH_ADDR')
    .bail(),
  body('collectionDeployers')
    .optional()
    .isArray()
    .custom(isCollectionDeployers)
    .toArray(),
  body('slug').optional().isEmpty().withMessage('UNKNOWN'),
  body('name')
    .optional()
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 191 })
    .withMessage('TOO_LONG'),
  body('description')
    .optional()
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 16383 })
    .withMessage('TOO_LONG')
    .bail(),
  body('paymentTokens')
    .optional()
    .isArray()
    .custom(isPaymentTokensArray)
    .toArray(),
  body('contractSchema')
    .optional()
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 16 })
    .withMessage('TOO_LONG')
    .bail(),
  body('email')
    .optional()
    .trim()
    .stripLow()
    .isEmail()
    .withMessage('NOT_EMAIL')
    .bail(),
  body('blogUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL()
    .withMessage('NOT_URL')
    .bail()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG')
    .bail(),
  body('redditUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL()
    .withMessage('NOT_URL')
    .bail()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG')
    .bail(),
  body('facebookUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL()
    .withMessage('NOT_URL')
    .bail()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG')
    .bail(),
  body('twitterHandle')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 16 })
    .withMessage('TOO_LONG')
    .bail(),
  body('discordUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('websiteUrl')
    .optional()
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isURL()
    .withMessage('NOT_URL')
    .bail()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('telegramUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('bitcointalkUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('githubUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('wechatUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('linkedInUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('whitepaperUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('imageUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL()
    .withMessage('NOT_URL')
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('bannerImageUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL()
    .withMessage('NOT_URL')
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG'),
  body('mintingPriceWl')
    .optional()
    .trim()
    .stripLow()
    .isFloat()
    .withMessage('NOT_FLOAT'),
  body('mintingPricePublic')
    .optional()
    .trim()
    .stripLow()
    .isFloat()
    .withMessage('NOT_FLOAT'),
  body('floorPrice')
    .optional()
    .trim()
    .stripLow()
    .isFloat()
    .withMessage('NOT_FLOAT'),
  body('document')
    .optional()
    .trim()
    .stripLow()
    .isInt()
    .withMessage('NOT_INT')
    .toInt(),
  body('marketplace')
    .optional()
    .trim()
    .stripLow()
    .isLength({ min: 1, max: 191 })
    .withMessage('TOO_LONG'),
  body('category')
    .optional()
    .trim()
    .stripLow()
    .isLength({ min: 1, max: 64 })
    .withMessage('TOO_LONG'),
  body('utility')
    .optional()
    .trim()
    .stripLow()
    .isLength({ min: 1, max: 64 })
    .withMessage('TOO_LONG'),
  body('team')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 16383 })
    .withMessage('TOO_LONG'),
  body('history')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 16383 })
    .withMessage('TOO_LONG'),
];

export const validateDeleteCollection = param('slug')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isLength({ min: 1, max: 191 })
  .withMessage('TOO_LONG')
  .bail();

export const validateGetCollectionCategories = query('q')
  .optional()
  .trim()
  .stripLow()
  .isLength({ max: 64 })
  .withMessage('TOO_LONG');

export const validateCreateCollectionCategory = body('name')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isLength({ max: 64 })
  .withMessage('TOO_LONG');

export const validateUpdateCollectionCategory = [
  param('cid')
    .notEmpty()
    .withMessage('REQUIRED')
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('name')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ max: 64 })
    .withMessage('TOO_LONG'),
];

export const validateDeleteCollectionCategory = param('cid')
  .notEmpty()
  .withMessage('REQUIRED')
  .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
  .withMessage('NOT_INT')
  .bail()
  .toInt();

export const validateGetCollectionUtilities = [
  query('q')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 64 })
    .withMessage('TOO_LONG'),
  param('cid').isInt().withMessage('NOT_INT').bail().toInt(),
];

export const validateCreateCollectionUtility = [
  param('cid')
    .notEmpty()
    .withMessage('REQUIRED')
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('name')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ max: 64 })
    .withMessage('TOO_LONG')
    .bail(),
];

export const validateUpdateCollectionUtility = [
  param('cid')
    .notEmpty()
    .withMessage('REQUIRED')
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('name')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ max: 64 })
    .withMessage('TOO_LONG')
    .bail(),
];

export const validateDeleteCollectionUtility = [
  query('cid')
    .notEmpty()
    .withMessage('REQUIRED')
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  query('uid')
    .notEmpty()
    .withMessage('REQUIRED')
    .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
];
