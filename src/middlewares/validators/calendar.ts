import { body, query, param, oneOf } from 'express-validator';
import isInt from 'validator/lib/isInt';
import { inMySQLIntRange } from './utils';

export const validateGetMintingSchedules = [
  query('start')
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isInt({ min: 0 })
    .withMessage('NOT_INT')
    .toInt(),
  query('end').optional().isInt().withMessage('NOT_INT').toInt(),
];

export const validateCreateMintingSchedule = [
  body('name')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ max: 191 })
    .withMessage('TOO_LONG'),
  body('tier')
    .isInt()
    .withMessage('NOT_INT')
    .custom(inMySQLIntRange)
    .withMessage('INT_OUT_OF_RANGE')
    .bail()
    .toInt(),
  body('mintingTime').trim().isISO8601().withMessage('NOT_DATE'),
  oneOf([
    body('mintingUrl')
      .optional()
      .trim()
      .stripLow()
      .isURL({ protocols: ['http', 'https'] })
      .withMessage('NOT_URL'),
    body('mintingUrl').optional().trim().stripLow().isEmpty(),
  ]),
  body('description')
    .optional()
    .trim()
    .stripLow(true)
    .isLength({ max: 16383 })
    .withMessage('TOO_LONG'),
  body('collection') // collectionId
    .optional()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('document').optional().isInt().withMessage('NOT_INT').bail().toInt(),
  body('mintingPrice')
    .optional()
    .isString()
    .withMessage('NOT_STRING')
    .bail()
    .isFloat()
    .withMessage('NOT_FLOAT')
    .bail()
    .isLength({ max: 191 })
    .withMessage('TOO_LONG'),
  body('mintingPriceSymbol')
    .optional()
    .trim()
    .stripLow()
    .isString()
    .withMessage('NOT_STRING')
    .bail()
    .isLength({ max: 16 })
    .withMessage('TOO_LONG'),
];

export const validateUpdateMintingSchedule = [
  param('id')
    .trim()
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
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isLength({ max: 191 })
    .withMessage('TOO_LONG'),
  body('tier')
    .optional()
    .isInt()
    .withMessage('NOT_INT')
    .custom(inMySQLIntRange)
    .withMessage('INT_OUT_OF_RANGE')
    .bail()
    .toInt(),
  body('mintingTime').optional().trim().isISO8601().withMessage('NOT_DATE'),
  body('mintingUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL({ protocols: ['http', 'https'] })
    .bail(),
  body('description')
    .optional()
    .trim()
    .stripLow(true)
    .isLength({ max: 16383 })
    .withMessage('TOO_LONG'),
  body('collection') // collectionId
    .optional()
    .isInt()
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  body('mintingPrice')
    .optional()
    .isString()
    .withMessage('NOT_STRING')
    .bail()
    .isFloat()
    .withMessage('NOT_FLOAT')
    .bail()
    .isLength({ max: 191 })
    .withMessage('TOO_LONG'),
  body('mintingPriceSymbol')
    .optional()
    .trim()
    .stripLow()
    .isString()
    .withMessage('NOT_STRING')
    .bail()
    .isLength({ max: 16 })
    .withMessage('TOO_LONG'),
];

export const validateDeleteMintingSchedule = param('id')
  .notEmpty()
  .withMessage('REQUIRED')
  .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
  .withMessage('NOT_INT')
  .bail()
  .toInt();

export const validateGetMyMintingSchedules = [
  query('start')
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isInt({ min: 0 })
    .withMessage('NOT_INT')
    .toInt(),
  query('end').optional().isInt().withMessage('NOT_INT').toInt(),
];

export const validateGetMintingScheduleById = param('id')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt({ min: 1 })
  .withMessage('NOT_INT')
  .bail()
  .toInt();

export const validateSaveMintingSchedule = body('id')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt({ min: 1 })
  .withMessage('NOT_INT')
  .bail()
  .toInt();

export const validateUnsaveMintingSchedule = param('id')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isInt({ min: 1 })
  .withMessage('NOT_INT')
  .toInt();

export const validateUnsaveMintingScheduleBulk = body('id')
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isArray()
  .withMessage('NOT_ARRAY')
  .bail()
  .custom((ids: any[]) => {
    if (!ids.forEach) throw new Error('NOT_ARRAY');
    ids.forEach((id) => {
      if (!isInt(id)) throw new Error('ARRAY_ITEMS_NOT_INT');
    });
    return true;
  })
  .toArray();
