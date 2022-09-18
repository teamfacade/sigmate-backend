import { body } from 'express-validator';
import isInt from 'validator/lib/isInt';
import isLength from 'validator/lib/isLength';

export const validateCreateWikiDocument = [
  body('title')
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
