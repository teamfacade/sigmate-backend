import { body, query, param } from 'express-validator';
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
