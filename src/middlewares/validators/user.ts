import {
  body,
  CustomSanitizer,
  CustomValidator,
  query,
} from 'express-validator';
import User, { availableThemes, USERNAME_MAX_LENGTH } from '../../models/User';
import isURL from 'validator/lib/isURL';
import { findUserByReferralCode } from '../../services/database/user';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';

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
  if (value.length > USERNAME_MAX_LENGTH) throw new Error('TOO_LONG');

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

export const isReferralCode = (value: string) => {
  if (!value) return false;
  if (value.length !== 16 || value.slice(0, 3) !== 'sg-' || value[9] !== '-')
    return false;
  return true;
};

export const isReferralCodeMine = (value: string, req: any) => {
  if (req.isUnauthenticated() || !req.user) throw new UnauthenticatedError();
  return value === req.user.referralCode;
};

const isReferralCodeValid: CustomValidator = (value, { req }) => {
  return new Promise((resolve, reject) => {
    // Check value
    if (!isReferralCode(value)) reject('NOT_REFERRAL_CODE');

    // Check if it is my own code
    if (isReferralCodeMine(value, req))
      if (req.user.referredBy) {
        // Check if I am already referred by someone
        reject('ALREADY_REFERRED');
      }

    // Check if user with given referral code exists
    findUserByReferralCode(value)
      .then((user) => {
        user ? resolve(true) : reject('REFERRED_USER_NOT_FOUND');
      })
      .catch(() => {
        reject('ERR_DB_REFERRAL');
      });
  });
};

const dateWithinRange: CustomSanitizer = (value: string) => {
  const user = new Date(value);
  const now = new Date();

  if (Math.abs(user.getTime() - now.getTime()) > 60 * 1000) return now.toJSON();
  return value;
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
  .custom(followsUserNamePolicy)
  .bail()
  .custom(checkUserNameChangeInterval)
  .bail()
  .custom(isUserNameAvailable)
  .withMessage('DUPLICATE')
  .bail();

export const validateUserCheck = [
  query('userName')
    .optional()
    .notEmpty()
    .withMessage('REQUIRED')
    .escape()
    .trim()
    .stripLow()
    .isLength({ min: 3 })
    .withMessage('TOO_SHORT')
    .bail()
    .isLength({ max: USERNAME_MAX_LENGTH })
    .withMessage('TOO_LONG')
    .bail()
    .custom(followsUserNamePolicy),
  query('referralCode')
    .optional()
    .notEmpty()
    .withMessage('EMPTY')
    .bail()
    .escape()
    .trim()
    .stripLow()
    .isLength({ max: 16 }),
];

export const validateUserPatch = [
  body('userId').optional().isEmpty().withMessage('UNKNOWN'),
  validateUserName,
  body('userNameUpdatedAt').optional().isEmpty().withMessage('UNKNOWN'),
  body('email')
    .optional()
    .trim()
    .stripLow()
    .isEmail()
    .withMessage('NOT_EMAIL')
    .bail()
    .isLength({ min: 1, max: 191 })
    .withMessage('TOO_LONG'),
  body('emailVerified').optional().isEmpty().withMessage('UNKNOWN'),
  body('group').isEmpty().withMessage('UNKNOWN'),
  body('primaryProfile').optional().isEmpty().withMessage('UNKNOWN'),
  body('isTester')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .toBoolean(),
  body('isAdmin').optional().isEmpty().withMessage('UNKNOWN'),
  body('metamaskWallet').optional().isEmpty().withMessage('UNKNOWN'),
  body('isMetamaskWalletPublic')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
  body('googleAccount').optional().isEmpty().withMessage('UNKNOWN'),
  body('googleAccountId').optional().isEmpty().withMessage('UNKNOWN'),
  body('twitterHandle').optional().isEmpty().withMessage('UNKNOWN'),
  body('isTwitterHandlePublic')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
  body('discordAccount').optional().isEmpty().withMessage('UNKNOWN'),
  body('isDiscordAccountPublic')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
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
    .toBoolean(),
  body('emailMarketing')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
  body('cookiesEssential')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
  body('cookiesAnalytics')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
  body('cookiesFunctional')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
  body('cookiesTargeting')
    .optional()
    .isBoolean()
    .withMessage('NOT_BOOLEAN')
    .bail()
    .toBoolean(),
  body('agreeTos')
    .optional()
    .isISO8601()
    .withMessage('NOT_DATE')
    .bail()
    .customSanitizer(dateWithinRange)
    .toDate(),
  body('agreePrivacy')
    .optional()
    .isISO8601()
    .withMessage('NOT_DATE')
    .bail()
    .customSanitizer(dateWithinRange)
    .toDate(),
  body('agreeLegal')
    .optional()
    .isISO8601()
    .withMessage('NOT_DATE')
    .bail()
    .customSanitizer(dateWithinRange)
    .toDate(),
  body('referralCode').optional().isEmpty().withMessage('UNKNOWN'),
  body('referredBy').optional().trim().stripLow().custom(isReferralCodeValid),
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
