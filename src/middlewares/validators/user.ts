import { body, CustomValidator, param } from 'express-validator';
import User, { availableThemes } from '../../models/User';
import { inMySQLIntRange, isReferralCode, toBoolean, toDate } from './utils';
import isURL from 'validator/lib/isURL';

const isUserNameAvailable: CustomValidator = async (value: string, { req }) => {
  if (req.user && req.user.userName === value) {
    throw new Error('ERR_USERNAME_ALREADY_MINE');
  }
  const user = await User.findOne({ where: { userName: value } });
  if (user) throw new Error('DUPLICATE');
  return true;
};

export const followsUserNamePolicy: CustomValidator = (value) => {
  // Check length
  if (value.length < 3) throw new Error('TOO_SHORT');
  if (value.length > 32) throw new Error('TOO_LONG');

  // ignore cases
  value = value.toLowerCase();

  // Only allow alphanumeric characters, underscores, dashes, and periods
  const allowed = /[^a-z|A-Z|0-9|\-|_|.]/;
  if (allowed.test(value)) throw new Error('ERR_USERNAME_ILLEGAL_CHARS');

  // Special characters cannot appear more than 2 times in a row
  const consecutiveSpecials = /[-|_|.]{2,}/;
  if (consecutiveSpecials.test(value))
    throw new Error('ERR_USERNAME_CONSECUTIVE_SPECIAL_CHARS');

  // Cannot start nor end with a special character
  const startsOrEndsWithSpecials = /^[-|_|.]|[-|_|.]$/;
  if (startsOrEndsWithSpecials.test(value))
    throw new Error('ERR_USERNAME_START_OR_END_WITH_SPECIAL_CHARS');

  // Cannot contain certain words
  const illegalWords = ['admin', 'sigmate', 'facade'];
  const valueWithoutSpecials = value.replace(/[-|_|.]/g, '');
  const containIllegalWords = illegalWords
    .map((iw) => valueWithoutSpecials.includes(iw))
    .reduce((p, c) => {
      return p || c;
    }, false);
  if (containIllegalWords) throw new Error('ERR_USERNAME_ILLEGAL_WORDS');

  // Cannot be a URL
  if (isURL(value)) throw new Error('ERR_USERNAME_IS_URL');

  return true;
};

export const checkUserNameChangeInterval: CustomValidator = (
  value,
  { req }
) => {
  if (req.isUnauthenticated() || !req.user)
    throw new Error('ERR_UNAUTHENTICATED');

  if (!req.body.userName) return true;

  // If never updated before, allow update
  const updatedAt: Date = req.user.userNameUpdatedAt;
  if (!updatedAt) return true;

  const now = new Date();
  const diff = now.getTime() - updatedAt.getTime();

  const DAY = 1000 * 60 * 60 * 24;

  if (diff >= DAY * 30) {
    return true;
  }

  throw new Error('ERR_USERNAME_CHANGE_INTERVAL');
};

export const validateUserName = body('userName')
  .optional()
  .escape()
  .trim()
  .stripLow()
  .isLength({ min: 3 })
  .withMessage('TOO_SHORT')
  .bail()
  .isLength({ max: 32 })
  .withMessage('TOO_LONG')
  .bail()
  .custom(isUserNameAvailable)
  .withMessage('DUPLICATE')
  .bail()
  .custom(followsUserNamePolicy)
  .custom(checkUserNameChangeInterval);

export const validateUserNameCheck = body('userName')
  .notEmpty()
  .withMessage('REQUIRED')
  .escape()
  .trim()
  .stripLow()
  .isLength({ min: 3 })
  .withMessage('TOO_SHORT')
  .bail()
  .isLength({ max: 32 })
  .withMessage('TOO_LONG')
  .bail()
  .custom(isUserNameAvailable)
  .bail()
  .custom(followsUserNamePolicy);

export const validateUserPatch = [
  body('userId').optional().isEmpty().withMessage('UNKNOWN'),
  body('googleAccountId').optional().isEmpty().withMessage('UNKNOWN'),
  validateUserName,
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
  body('referralCode').optional().isEmpty().withMessage('UNKNOWN'),
  body('referredBy').optional().isEmpty().withMessage('UNKNOWN'),
];

export const validatePostReferralCode = body('renew')
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isBoolean()
  .withMessage('NOT_BOOLEAN')
  .bail()
  .equals('true')
  .withMessage('NOT_TRUE')
  .toBoolean();

export const validateCheckReferralCode = param('referralCode')
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .trim()
  .stripLow()
  .escape()
  .custom(isReferralCode);
