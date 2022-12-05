import { CustomValidator, ValidationChain } from 'express-validator';
import { FindOptions, WhereOptions } from 'sequelize/types';
import isURL from 'validator/lib/isURL';
import getValidationChain from '../../middlewares/validators';
import UserModel, {
  UserAttribs,
  UserCAttribs,
  USER_DELETE_SUFFIX_LENGTH,
  USER_USERNAME_MAX_LENGTH,
  USER_USERNAME_MIN_LENGTH,
} from '../../models/User.model';
import UserAuth, { UserAuthAttribs } from '../../models/UserAuth.model';
import UserGroup from '../../models/UserGroup.model';
import Action from '../Action';
import RequestError from '../errors/RequestError';
import ModelService, { ValidateOneOptions } from '../ModelService';

type UserOptions = {
  model?: UserModel;
};

type UserFindDTO = {
  id?: UserAttribs['id'];
  userName?: UserAttribs['userName'];
  metamaskWallet?: UserAttribs['metamaskWallet'];
  googleAccountId?: UserAttribs['googleAccountId'];
  referralCode?: UserAttribs['referralCode'];
  options?: keyof typeof User['FIND_OPTIONS'];
  rejectOnEmpty?: boolean;
};

type UserExistsDTO = Omit<UserFindDTO, 'options'>;

type UserCreateDTO = {
  google?: {
    email: NonNullable<UserAttribs['email']>;
    googleAccount: NonNullable<UserAttribs['googleAccount']>;
    googleAccountId: NonNullable<UserAttribs['googleAccountId']>;
    profileImageUrl: NonNullable<UserAttribs['profileImageUrl']>;
  };
  metamask?: {
    metamaskWallet: NonNullable<UserAttribs['metamaskWallet']>;
    isMetamaskVerified: NonNullable<UserAttribs['isMetamaskVerified']>;
  };
};

interface UserUpdateDTO
  extends Pick<
    UserCAttribs,
    | 'userName'
    | 'email'
    | 'displayName'
    | 'bio'
    | 'profileImageUrl'
    | 'metamaskWallet'
    | 'isMetamaskVerified'
    | 'googleAccount'
    | 'googleAccountId'
    | 'twitterHandle'
    | 'discordAccount'
    | 'isMetamaskWalletPublic'
    | 'isTwitterHandlePublic'
    | 'isDiscordAccountPublic'
    | 'locale'
    | 'emailEssential'
    | 'emailMarketing'
    | 'cookiesEssential'
    | 'cookiesAnalytics'
    | 'cookiesFunctional'
    | 'cookiesTargeting'
    | 'agreeTos'
    | 'agreePrivacy'
    | 'agreeLegal'
    | 'referralCode'
  > {
  user?: UserModel;
}

type UpdateAuthDTO = {
  renew?: {
    sigmateAccessTokenIat?: UserAuthAttribs['sigmateAccessTokenIat'];
    sigmateRefreshTokenIat?: UserAuthAttribs['sigmateRefreshTokenIat'];
  };
};

type UserReloadDTO = {
  user?: UserModel;
  options?: keyof typeof User['FIND_OPTIONS'];
};

type ErrorTypes =
  | 'USER_NOT_SET'
  | 'USER_AUTH_NOT_SET'
  | 'CREATE_DTO_UNSET'
  | 'UPDATE_AUTH_DTO_UNSET'
  | 'USERNAME_TAKEN'
  | 'REFERRAL_CODE_NOT_FOUND'
  | 'REFERRAL_ALREADY_SET';

type UserFindOptionNames = 'DEFAULT' | 'EXISTS' | 'AUTH' | 'AUTH_TOKEN' | 'ALL';

export default class User extends ModelService<UserAttribs> {
  /**
   * Options to use when fetching user information from the database
   *
   * **ALWAYS** include `id` for all models (to use the `save` method)
   */
  static FIND_OPTIONS: Record<UserFindOptionNames, FindOptions<UserAttribs>> =
    Object.freeze({
      DEFAULT: {
        attributes: ['id', 'isAdmin'],
        include: [UserGroup],
      },
      EXISTS: { attributes: ['id'] },
      AUTH: {
        attributes: ['id', 'isAdmin'],
        include: [{ model: UserAuth }, { model: UserGroup }],
      },
      AUTH_TOKEN: {
        attributes: ['id', 'isAdmin'],
        include: [
          {
            model: UserAuth,
            attributes: [
              'id',
              'sigmateAccessTokenIat',
              'sigmateRefreshTokenIat',
            ],
          },
          { model: UserGroup },
        ],
      },
      ALL: {
        include: [UserGroup],
      },
    });

  name = 'USER';
  model?: UserModel;
  get serviceStatus() {
    return User.status;
  }
  get found() {
    return Boolean(this.model);
  }
  constructor(options: UserOptions = {}) {
    super();
    this.model = options.model;
  }

  async find(dto: UserFindDTO, parentAction: Action | undefined = undefined) {
    const {
      id,
      userName,
      metamaskWallet,
      googleAccountId,
      referralCode,
      options = 'DEFAULT',
      rejectOnEmpty = false,
    } = dto;
    const action = new Action({
      type: Action.TYPE.DATABASE,
      name: 'USER_FIND',
      target: { model: UserModel },
      parent: parentAction,
    });
    const where: WhereOptions<UserAttribs> = {};
    if (id) {
      where.id = id;
    } else if (userName) {
      where.userName = userName;
    } else if (googleAccountId) {
      where.googleAccountId = googleAccountId;
    } else if (metamaskWallet) {
      where.metamaskWallet = metamaskWallet;
    } else if (referralCode) {
      where.referralCode = referralCode;
    } else {
      return null;
    }
    const user = await action.run((transaction) =>
      UserModel.findOne({
        where,
        transaction,
        rejectOnEmpty,
        ...User.FIND_OPTIONS[options],
      })
    );
    if (user) {
      action.setTarget({ id: user.id });
      this.model = user;
    }
    return user;
  }

  async exists(
    dto: UserExistsDTO,
    parentAction: Action | undefined = undefined
  ) {
    const user = await this.find({ ...dto, options: 'EXISTS' }, parentAction);
    if (user) this.model = user;
    return user;
  }

  async create(
    dto: UserCreateDTO,
    parentAction: Action | undefined = undefined
  ) {
    const action = new Action({
      type: Action.TYPE.SERVICE,
      name: 'USER_CREATE',
      target: { model: UserModel },
      transaction: true,
      parent: parentAction,
    });

    return await action.run(async (transaction, action) => {
      // Create user
      const createUser = new Action({
        type: Action.TYPE.DATABASE,
        name: 'USER_CREATE',
        target: { model: UserModel },
        parent: action,
      });
      const user = await createUser.run(async (transaction, action) => {
        const user = await UserModel.create({}, { transaction });
        action.setTarget({ id: user.id });
        return user;
      });
      action.setTarget({ id: user.id });

      // Update attribs
      if (dto.google) {
        const { email, googleAccount, googleAccountId, profileImageUrl } =
          dto.google;
        user.set('email', email);
        user.set('isEmailVerified', true);
        user.set('googleAccount', googleAccount);
        user.set('googleAccountId', googleAccountId);
        user.set('profileImageUrl', profileImageUrl);
      } else if (dto.metamask) {
        const { metamaskWallet, isMetamaskVerified } = dto.metamask;
        user.set('metamaskWallet', metamaskWallet);
        user.set('isMetamaskVerified', isMetamaskVerified);
      } else {
        this.onError({ type: 'CREATE_DTO_UNSET' });
      }
      user.set('referralCode', '39857632459');

      // Save the updates
      const saveUser = new Action({
        type: Action.TYPE.DATABASE,
        name: 'USER_SAVE',
        target: { model: UserModel, id: user.id },
        parent: action,
      });
      await saveUser.run((transaction) => user.save({ transaction }));

      // Create auth entry and associate
      const createAuth = new Action({
        type: Action.TYPE.DATABASE,
        name: 'USER_CREATE_AUTH',
        target: { model: UserAuth },
        parent: action,
      });
      await createAuth.run(async (transaction, action) => {
        const auth = await UserAuth.create({}, { transaction });
        action.setTarget({ id: auth.id });
        await user.$set('auth', auth, { transaction });
      });
      this.model = user;
      return user;
    });
  }

  async update(
    dto: UserUpdateDTO,
    parentAction: Action | undefined = undefined
  ) {
    const {
      userName,
      email,
      displayName,
      bio,
      profileImageUrl,
      metamaskWallet,
      googleAccount,
      googleAccountId,
      isMetamaskWalletPublic,
      isDiscordAccountPublic,
      isTwitterHandlePublic,
      locale,
      emailEssential,
      emailMarketing,
      cookiesAnalytics,
      cookiesEssential,
      cookiesFunctional,
      cookiesTargeting,
      agreeLegal,
      agreePrivacy,
      agreeTos,
      referralCode,
    } = dto;

    const user = dto.user || this.model;
    if (!user) this.onError({ type: 'USER_NOT_SET' });

    const action = new Action({
      type: Action.TYPE.SERVICE,
      name: 'USER_UPDATE',
      target: { model: UserModel, id: user.id },
      parent: parentAction,
      transaction: true,
    });
    await this.reload({ user, options: 'ALL' }, action);

    if (userName) {
      const userNameNotAvailable = await this.exists({ userName }, action);
      if (userNameNotAvailable) {
        this.onError({ type: 'USERNAME_TAKEN' });
      }
      user.set('userName', userName);
      user.set('userNameUpdatedAt', new Date());
    }
    if (email !== undefined) {
      user.set('email', email);
      user.set('isEmailVerified', false);
    }
    if (displayName !== undefined) {
      user.set('displayName', displayName);
    }
    if (bio !== undefined) {
      user.set('bio', bio);
    }
    if (profileImageUrl === '' || profileImageUrl === null) {
      user.set('profileImageUrl', null);
    }
    if (metamaskWallet !== undefined) {
      user.set('metamaskWallet', metamaskWallet);
      user.set('isMetamaskVerified', false);
      if (!metamaskWallet) {
        user.set('isMetamaskVerified', null);
        user.set('isMetamaskWalletPublic', null);
      }
    }
    if (googleAccount === '' || googleAccount === null) {
      user.set('googleAccount', null);
    }
    if (googleAccountId === '' || googleAccountId === null) {
      user.set('googleAccountId', null);
    }
    if (isMetamaskWalletPublic !== undefined) {
      user.set('isMetamaskWalletPublic', isMetamaskWalletPublic);
    }
    if (isDiscordAccountPublic !== undefined) {
      user.set('isDiscordAccountPublic', isDiscordAccountPublic);
    }
    if (isTwitterHandlePublic !== undefined) {
      user.set('isTwitterHandlePublic', isTwitterHandlePublic);
    }
    if (locale !== undefined) {
      user.set('locale', locale);
    }
    if (emailEssential !== undefined) {
      user.set('emailEssential', emailEssential);
    }
    if (emailMarketing !== undefined) {
      user.set('emailMarketing', emailMarketing);
    }
    if (cookiesAnalytics !== undefined) {
      user.set('cookiesAnalytics', cookiesAnalytics);
    }
    if (cookiesEssential !== undefined) {
      user.set('cookiesEssential', cookiesEssential);
    }
    if (cookiesFunctional !== undefined) {
      user.set('cookiesFunctional', cookiesFunctional);
    }
    if (cookiesTargeting !== undefined) {
      user.set('cookiesTargeting', cookiesTargeting);
    }
    if (agreeTos !== undefined) {
      user.set('agreeTos', agreeTos);
    }
    if (agreePrivacy !== undefined) {
      user.set('agreePrivacy', agreePrivacy);
    }
    if (agreeLegal !== undefined) {
      user.set('agreeLegal', agreeLegal);
    }
    // Update referral code
    if (referralCode) {
      if (user.referralCode) {
        // Referral code is already set. Cannot update
        this.onError({ type: 'REFERRAL_ALREADY_SET' });
      } else {
        // Check if user with referral code exists
        const referredBy = await this.exists({ referralCode }, action);
        if (referredBy) {
          user.set('referredById', referredBy.id);
        } else {
          this.onError({ type: 'REFERRAL_CODE_NOT_FOUND' });
        }
      }
    }
    return await action.run(async (transaction, action) => {
      const saveAction = new Action({
        type: Action.TYPE.DATABASE,
        name: 'USER_UPDATE_SAVE',
        target: { model: UserModel, id: user.id },
        parent: action,
      });
      return await saveAction.run((transaction) => user.save({ transaction }));
    });
  }

  async updateAuth(
    dto: UpdateAuthDTO,
    parentAction: Action | undefined = undefined
  ) {
    const { renew } = dto;
    if (!this.model) this.onError({ type: 'USER_NOT_SET' });
    if (!this.model.auth)
      await this.reload({ options: 'AUTH_TOKEN' }, parentAction);
    const auth = this.model?.auth;
    if (!auth) this.onError({ type: 'USER_NOT_SET' });
    if (renew) {
      auth.set('sigmateAccessTokenIat', renew.sigmateAccessTokenIat);
      auth.set('sigmateRefreshTokenIat', renew.sigmateRefreshTokenIat);
    } else {
      this.onError({ type: 'UPDATE_AUTH_DTO_UNSET' });
    }
    const update = new Action({
      type: Action.TYPE.DATABASE,
      name: 'USER_UPDATE_AUTH',
      target: { model: UserAuth, id: auth.id },
      parent: parentAction,
    });
    await update.run((transaction) => auth.save({ transaction }));
  }

  async reload(
    dto: UserReloadDTO,
    parentAction: Action | undefined = undefined
  ) {
    const user = dto.user || this.model;
    if (!user) this.onError({ type: 'USER_NOT_SET' });
    const options = dto.options || 'DEFAULT';
    const action = new Action({
      type: Action.TYPE.DATABASE,
      name: `USER_RELOAD (${options})`,
      target: { model: UserModel, id: user.id },
      parent: parentAction,
    });
    await action.run(async (transaction) =>
      user.reload({
        ...User.FIND_OPTIONS[options],
        transaction,
      })
    );
  }

  private onError(options: sigmate.Error.HandlerOptions<ErrorTypes>): never {
    const { type, error: cause } = options;
    let message = options.message || '';
    let status = 500;
    switch (type) {
      case 'USER_NOT_SET':
        message = message || 'User not set';
        status = 401;
        break;
      case 'USER_AUTH_NOT_SET':
        message = message || 'User auth data not found';
        break;
      case 'CREATE_DTO_UNSET':
        message = message || 'User create DTO is empty';
        break;
      case 'UPDATE_AUTH_DTO_UNSET':
        message = message || 'UserAuth update DTO is empty';
        break;
      case 'USERNAME_TAKEN':
        message = message || 'Username already taken';
        status = 422;
        break;
      case 'REFERRAL_CODE_NOT_FOUND':
        message = message || 'Referral code not found';
        status = 422;
        break;
      case 'REFERRAL_ALREADY_SET':
        message = message || 'Referral code already set';
        status = 422;
        break;
      default:
        message = message || 'UNEXPECTED';
        break;
    }
    throw new RequestError({
      name: 'UserError',
      message,
      critical: false,
      cause,
      status,
    });
  }

  /**
   * Custom validator to check if userName follows username policy
   * @param value userName
   * @returns True if test passed, false otherwise
   */
  private followsUserNamePolicy: CustomValidator = (value: string) => {
    // Check length
    if (value.length < USER_USERNAME_MIN_LENGTH) throw new Error('TOO_SHORT');
    if (value.length > USER_USERNAME_MAX_LENGTH) throw new Error('TOO_LONG');

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
    const valueWithoutSpecials = value.replace(/[-|_|.]/g, '').toLowerCase();
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

  private isTimeDiffWithinLimits: CustomValidator = (value) => {
    // Assumes isISO8601 was run before this validator
    // i.e., value is a valid ISO8601 date

    const diff = new Date().getTime() - new Date(value).getTime();
    return 0 <= diff && diff <= 5 * 60 * 1000; // 5 minutes
  };

  public validateOne(
    options: ValidateOneOptions<UserAttribs>
  ): ValidationChain {
    const { chain, field } = options;
    switch (field) {
      case 'userName':
        return chain
          .isLength({
            min: USER_USERNAME_MIN_LENGTH,
            max: USER_USERNAME_MAX_LENGTH,
          })
          .withMessage('LENGTH')
          .custom(this.followsUserNamePolicy);
      case 'email':
        return chain
          .isLength({ max: 255 - USER_DELETE_SUFFIX_LENGTH })
          .withMessage('TOO_LONG')
          .bail()
          .isEmail()
          .withMessage('NOT_EMAIL');
      case 'displayName':
        return chain
          .trim()
          .stripLow()
          .isLength({ max: 255 })
          .withMessage('TOO_LONG');
      case 'bio':
        return getValidationChain('sql/text', chain);
      case 'metamaskWallet':
        return getValidationChain('metamaskWallet', chain);
      case 'twitterHandle':
        return getValidationChain('twitterHandle', chain);
      case 'emailEssential':
      case 'emailMarketing':
      case 'cookiesEssential':
      case 'cookiesAnalytics':
      case 'cookiesFunctional':
      case 'cookiesTargeting':
        return chain.isBoolean().withMessage('NOT_BOOLEAN').toBoolean();
      case 'agreeTos':
      case 'agreePrivacy':
      case 'agreeLegal':
        return chain
          .isISO8601()
          .withMessage('NOT_DATE')
          .custom(this.isTimeDiffWithinLimits)
          .withMessage('TIME_DIFF_OUT_OF_LIMITS');
      case 'referralCode':
        return chain
          .isNumeric()
          .withMessage('NOT_NUMERIC')
          .isLength({ min: 12, max: 12 })
          .withMessage('LENGTH');
      default:
        return chain.optional().isEmpty().withMessage('INVALID_FIELD');
    }
  }
}
