import { body, CustomValidator, param } from 'express-validator';
import User, { availableThemes } from '../../models/User';

const isUserNameAvailable: CustomValidator = async (value: string) => {
  const user = await User.findOne({ where: { userName: value } });
  if (user) throw new Error('DUPLICATE');
  return user;
};

export const validateUserPatch = [
  param('userId')
    .escape()
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .isUUID()
    .withMessage('INVALID'),
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
    .isLength({ max: 36 })
    .withMessage('TOO_LONG')
    .custom(isUserNameAvailable)
    .withMessage('DUPLICATE'),
  body('email')
    .optional()
    .escape()
    .trim()
    .stripLow()
    .normalizeEmail({ gmail_remove_dots: false })
    .isEmail()
    .withMessage('NOT_EMAIL'),
  body('emailVerified').optional().isEmpty().withMessage('UNKNOWN'),
  body('group').optional().isEmpty().withMessage('UNKNOWN'),
  body('primaryProfile').optional().isInt().withMessage('NOT_INT'),
  body('isTester').optional().isBoolean().withMessage('NOT_BOOLEAN'),
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
    .isIn(availableThemes)
    .withMessage('NOT_THEME'),
  body('emailEssential').optional().isBoolean().withMessage('NOT_BOOLEAN'),
  body('emailMarketing').optional().isBoolean().withMessage('NOT_BOOLEAN'),
  body('cookiesEssential').optional().isBoolean().withMessage('NOT_BOOLEAN'),
  body('cookiesAnalytics').optional().isBoolean().withMessage('NOT_BOOLEAN'),
  body('cookieEssential').optional().isBoolean().withMessage('NOT_BOOLEAN'),
  body('cookiesTargeting').optional().isBoolean().withMessage('NOT_BOOLEAN'),
  body('agreeTos').optional().isISO8601().withMessage('NOT_DATE'),
  body('agreePrivacy').optional().isISO8601().withMessage('NOT_DATE'),
  body('agreeLegal').optional().isISO8601().withMessage('NOT_DATE'),
];

export const validateUserDelete = param('userId')
  .escape()
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isUUID()
  .withMessage('INVALID');
