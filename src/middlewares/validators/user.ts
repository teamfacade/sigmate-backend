import { body, oneOf, query, ValidationChain } from 'express-validator';
import { Middleware } from 'express-validator/src/base';
import BaseValidator, { RequestValidator, ValidatorFactory } from '.';
import { SIZE_FULLNAME, SIZE_USERNAME } from '../../models/User.model';
import AccountService, { account } from '../../services/account';

export default class UserValidator extends BaseValidator {
  private static userName: ValidatorFactory = (chain) => {
    return chain
      .trim()
      .stripLow()
      .isLength({ min: AccountService.SIZE_USERNAME_MIN, max: SIZE_USERNAME })
      .withMessage('LENGTH')
      .custom((value) => {
        account.checkUserNamePolicy(value);
      })
      .isString();
  };

  private static fullName: ValidatorFactory = (chain) => {
    return chain
      .trim()
      .stripLow()
      .isLength({ max: SIZE_FULLNAME })
      .withMessage('TOO_LONG')
      .isString();
  };

  private static bio: ValidatorFactory = (chain) => {
    return chain
      .trim()
      .stripLow(true)
      .isLength({ max: 191 })
      .withMessage('TOO_LONG')
      .isString();
  };

  private static email: ValidatorFactory = (chain) => {
    return chain.isString().bail().isEmail();
  };

  private static flag: ValidatorFactory = (chain) => {
    return chain.isBoolean().toBoolean();
  };

  private static locale: ValidatorFactory = (chain) => {
    return chain.isString().bail().trim().isLocale();
  };

  private static referralCode: ValidatorFactory = (chain) => {
    return chain
      .trim()
      .stripLow()
      .isString()
      .bail()
      .isLength({ min: 10, max: 10 });
  };

  @RequestValidator
  public static updateMyInfo: (ValidationChain | Middleware)[] = [
    this.userName(body('userName')).optional(),
    this.fullName(body('fullName')).optional(),
    this.bio(body('bio')).optional(),
    oneOf([this.email(body('email')).optional(), body('email').isEmpty()]),
    this.flag(body('isGooglePublic')).optional(),
    this.flag(body('isTwitterPublic')).optional(),
    this.flag(body('isDiscordPublic')).optional(),
    this.flag(body('isMetamaskPublic')).optional(),
    this.locale(body('locale')).optional(),
    this.referralCode(body('referredBy')).optional(),
    this.flag(body('agreeTos')).optional(),
    this.flag(body('agreeLegal')).optional(),
    this.flag(body('agreePrivacy')).optional(),
  ];

  @RequestValidator
  public static check = [
    this.userName(query('userName')).optional(),
    this.referralCode(query('referralCode')).optional(),
  ];
}
