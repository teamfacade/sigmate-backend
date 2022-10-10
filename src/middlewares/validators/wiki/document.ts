import { body, param } from 'express-validator';
import isInt from 'validator/lib/isInt';
import isLength from 'validator/lib/isLength';

export const validateGetWikiDocumentById = param('id')
  .notEmpty()
  .withMessage('REQUIRED')
  .isInt()
  .withMessage('NOT_INT')
  .bail()
  .toInt();

export const validateCreateWikiDocument = [
  body('title')
    .optional()
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ max: 191 })
    .withMessage('TOO_LONG')
    .bail(),
  body('parent').optional().isInt().withMessage('NOT_INT').toInt(),
  body('collection')
    .optional()
    .isObject()
    .withMessage('NOT_OBJECT')
    .bail()
    .custom((value) => {
      const { slug, marketplace } = value;
      if (!slug) {
        throw new Error('collection.slug: REQUIRED');
      }
      if (!isLength(slug, { max: 191 })) {
        throw new Error('collection.slug: TOO_LONG');
      }
      if (!marketplace) {
        throw new Error('collection.marketplace: REQUIRED');
      }
      if (!isLength(marketplace, { max: 191 })) {
        throw new Error('collection.marketplace: TOO_LONG');
      }
      return true;
    }),
  body('nft')
    .optional()
    .isObject()
    .withMessage('NOT_OBJECT')
    .bail()
    .custom((value) => {
      const { contractAddress, tokenId } = value;
      if (!contractAddress) {
        throw new Error('nft.contractAddress: REQUIRED');
      }
      if (!isLength(contractAddress, { max: 64 })) {
        throw new Error('nft.contractAddress: TOO_LONG');
      }
      if (!tokenId) {
        throw new Error('nft.tokenId: REQUIRED');
      }
      if (!isInt(tokenId)) {
        throw new Error('nft.tokenId: NOT_INT');
      }
      return true;
    }),
];

export const validateUpdateWikiDocument = [
  param('id')
    .notEmpty()
    .withMessage('REQUIRED')
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('document').isObject(),
  body('document.title')
    .optional()
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .isLength({ max: 191 })
    .withMessage('TOO_LONG')
    .bail(),
  body('document.structure.*')
    .optional()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('document.structure')
    .optional()
    .isArray()
    .withMessage('NOT_ARRAY')
    .bail()
    .toArray(),
  body('document.parent')
    .optional()
    .trim()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('document.blocks')
    .optional()
    .isArray()
    .withMessage('NOT_ARRAY')
    .bail()
    .toArray(),
  body('document.blocks.*.id')
    .optional()
    .notEmpty()
    .withMessage('REQUIRED')
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('document.blocks.*.element')
    .optional()
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isString()
    .withMessage('NOT_STRING')
    .isLength({ max: 16 })
    .withMessage('TOO_LONG'),
  body('document.blocks.*.textContent')
    .optional()
    .trim()
    .stripLow(true)
    .notEmpty()
    .isString()
    .isLength({ max: 16383 }),
  body('document.blocks.*.structure.*')
    .optional()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('document.blocks.*.structure')
    .optional()
    .isArray()
    .withMessage('NOT_ARRAY')
    .bail()
    .toArray(),
  body('document.blocks.*.style')
    .optional()
    .trim()
    .stripLow()
    .isString()
    .withMessage('NOT_STRING'),
  body('document.blocks.*.parent')
    .optional()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('document.categories')
    .optional()
    .isArray()
    .withMessage('NOT_ARRAY')
    .bail()
    .toArray(),
  body('document.categories.*')
    .optional()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('collection.name')
    .optional()
    .trim()
    .stripLow()
    .isString()
    .notEmpty()
    .withMessage('REQUIRED')
    .isLength({ max: 191 })
    .withMessage('TOO_LONG'),
  body('collection.description')
    .optional()
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ min: 1, max: 16383 })
    .withMessage('TOO_LONG')
    .bail(),
  body('collection.paymentTokens')
    .optional()
    .isObject()
    .withMessage('NOT_OBJECT'),
  body('collection.paymentTokens.*.name')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 191 })
    .withMessage('TOO_LONG'),
  body('collection.paymentTokens.*.symbol')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ max: 16 })
    .withMessage('TOO_LONG'),
  body('collection.paymentTokens.*.address')
    .isEthereumAddress()
    .withMessage('INVALID_ETH_ADDR')
    .isInt()
    .withMessage('NOT_INT'),
  body('collection.paymentTokens.*.imageUrl').isURL().withMessage('NOT_URL'),
  body('collection.paymentTokens.*.decimals')
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('collection.twitterHandle')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 16 })
    .withMessage('TOO_LONG'),
  body('collection.discordUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG')
    .isURL()
    .withMessage('NOT_URL'),
  body('collection.websiteUrl')
    .optional()
    .trim()
    .stripLow()
    .notEmpty()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG')
    .isURL()
    .withMessage('NOT_URL'),
  body('colelction.imageurl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG')
    .isURL()
    .withMessage('NOT_URL'),
  body('collection.bannerImageUrl')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 1024 })
    .withMessage('TOO_LONG')
    .isURL()
    .withMessage('NOT_URL'),
  body('collection.mintingPriceWl')
    .optional()
    .trim()
    .stripLow()
    .isString()
    .withMessage('NOT_STRING')
    .isLength({ max: 255 })
    .withMessage('TOO_LONG')
    .isFloat()
    .withMessage('NOT_FLOAT'),
  body('collection.mintingPricePublic')
    .optional()
    .trim()
    .stripLow()
    .isString()
    .withMessage('NOT_STRING')
    .isLength({ max: 255 })
    .withMessage('TOO_LONG')
    .isFloat()
    .withMessage('NOT_FLOAT'),
  body('collection.floorPrice')
    .optional()
    .trim()
    .stripLow()
    .isString()
    .withMessage('NOT_STRING')
    .isLength({ max: 255 })
    .withMessage('TOO_LONG')
    .isFloat()
    .withMessage('NOT_FLOAT'),
  body('collection.marketplace')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 191 })
    .withMessage('TOO_LONG'),
  body('collection.category')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 64 })
    .withMessage('TOO_LONG'),
  body('collection.utility')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 64 })
    .withMessage('TOO_LONG'),
  body('collection.team')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 16383 })
    .withMessage('TOO_LONG'),
  body('collection.history')
    .optional()
    .trim()
    .stripLow()
    .isLength({ max: 16383 })
    .withMessage('TOO_LONG'),
];
