import { body, CustomValidator } from 'express-validator';
import User, { availableThemes } from '../../models/User';
import { inMySQLIntRange, toBoolean, toDate } from './utils';

const isUserNameAvailable: CustomValidator = async (value: string, { req }) => {
  if (req.user) {
    if (req.user.userName === value) return;
  }
  const user = await User.findOne({ where: { userName: value } });
  if (user) throw new Error('DUPLICATE');
  return user;
};

export const validateUserPatch = [
  body('userId').optional().isEmpty().withMessage('UNKNOWN'),
  body('googleAccountId').optional().isEmpty().withMessage('UNKNOWN'),
  body('userName')
    .optional()
    .escape()
    .trim()
    .stripLow()
    .isString()
    .withMessage('NOT_STRING')
    .bail()
    .isLength({ min: 1 })
    .withMessage('TOO_SHORT')
    .bail()
    .isLength({ max: 32 })
    .withMessage('TOO_LONG')
    .custom(isUserNameAvailable)
    .withMessage('DUPLICATE'),
  body('email')
    .optional()
    .escape()
    .trim()
    .stripLow()
    .isEmail()
    .withMessage('NOT_EMAIL')
    .bail()
    .isLength({ max: 191 })
    .withMessage('TOO_LONG'),
  body('emailVerified').optional().isEmpty().withMessage('UNKNOWN'),
  body('group').isEmpty().withMessage('UNKNOWN'),
  body('primaryProfile')
    .optional()
    .isInt()
    .custom(inMySQLIntRange())
    .withMessage('NOT_INT'),
  body('isTester')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .customSanitizer(toBoolean),
  body('isAdmin').optional().isEmpty().withMessage('UNKNOWN'),
  body('metamaskWallet').optional().isEmpty().withMessage('UNKNOWN'),
  body('lastLoginAt').optional().isEmpty().withMessage('UNKNOWN'),
  body('locale')
    .optional()
    .escape()
    .trim()
    .stripLow()
    .isLength({ max: 5 })
    .withMessage('TOO_LONG')
    .bail()
    .isLocale()
    .withMessage('NOT_LOCALE'),
  body('theme')
    .optional()
    .escape()
    .trim()
    .stripLow()
    .isLength({ max: 5 })
    .withMessage('TOO_LONG')
    .bail()
    .isIn(availableThemes)
    .withMessage('NOT_THEME'),
  body('emailEssential')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .customSanitizer(toBoolean),
  body('emailMarketing')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .customSanitizer(toBoolean),
  body('cookiesEssential')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .customSanitizer(toBoolean),
  body('cookiesAnalytics')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .customSanitizer(toBoolean),
  body('cookieEssential')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .customSanitizer(toBoolean),
  body('cookiesTargeting')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .customSanitizer(toBoolean),
  body('agreeTos')
    .optional()
    .isISO8601()
    .withMessage('NOT_DATE')
    .bail()
    .customSanitizer(toDate),
  body('agreePrivacy')
    .optional()
    .isISO8601()
    .withMessage('NOT_DATE')
    .bail()
    .customSanitizer(toDate),
  body('agreeLegal')
    .optional()
    .isISO8601()
    .withMessage('NOT_DATE')
    .bail()
    .customSanitizer(toDate),
];
