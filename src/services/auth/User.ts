import { CustomValidator, ValidationChain } from 'express-validator';
import { FindOptions, WhereOptions } from 'sequelize/types';
import isURL from 'validator/lib/isURL';
import { pick } from 'lodash';
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
import ModelService, { ValidateOneOptions } from '../ModelService';
import UserError from '../errors/UserError';
import { randomInt } from 'crypto';
import Privilege from '../../models/Privilege.model';

type UserOptions = {
  user?: UserModel;
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
    locale?: UserAttribs['locale'];
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
    | 'fullName'
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
  google?: {
    googleAccessToken: UserAuthAttribs['googleAccessToken'];
    googleRefreshToken?: UserAuthAttribs['googleRefreshToken'];
  };
  metamask?: {
    nonce: UserAuthAttribs['metamaskNonce'];
  };
};

type UserReloadDTO = {
  user?: UserModel;
  options?: keyof typeof User['FIND_OPTIONS'];
};

type UserFindOptionNames =
  | 'DEFAULT'
  | 'EXISTS'
  | 'MY'
  | 'MY_ALL' // slow
  | 'MY_ALL+AUTH_TOKEN' //slow
  | 'PUBLIC'
  | 'PUBLIC_ALL' // slow
  | 'AUTH_TOKEN'
  | 'AUTH_GOOGLE'
  | 'AUTH_METAMASK'
  | 'ALL'; // slow

type ToResponseDTO = {
  type?: 'MY' | 'PUBLIC';
  model: UserModel | null;
};

export type UserResponse = Pick<
  UserAttribs,
  | 'id'
  | 'userName'
  | 'email'
  | 'isEmailVerified'
  | 'isAdmin'
  | 'isTester'
  | 'isDev'
  | 'isTeam'
  | 'fullName'
  | 'bio'
  | 'profileImageUrl'
  | 'metamaskWallet'
  | 'isMetamaskVerified'
  | 'isMetamaskWalletPublic'
  | 'googleAccount'
  | 'twitterHandle'
  | 'isTwitterHandlePublic'
  | 'discordAccount'
  | 'isDiscordAccountPublic'
  | 'lastLoginAt'
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
  | 'groupId'
>;

type UserAuthFindOptionName = 'TOKEN' | 'GOOGLE' | 'METAMASK';

// ALWAYS!! include the id Attribute
export const FIND_ATTRIBS_AUTH: Record<
  UserAuthFindOptionName,
  (keyof UserAuthAttribs)[]
> = {
  TOKEN: ['id', 'sigmateAccessTokenIat', 'sigmateRefreshTokenIat'],
  GOOGLE: ['id', 'googleAccessToken', 'googleRefreshToken'],
  METAMASK: ['id', 'metamaskNonce'],
};

// ALWAYS!! include the id Attribute
const FIND_ATTRIBS: Readonly<
  Record<UserFindOptionNames, (keyof UserAttribs)[] | undefined>
> = Object.freeze({
  DEFAULT: ['id', 'isAdmin', 'isTester', 'groupId'],
  EXISTS: ['id'],
  MY: [
    'id',
    'userName',
    'email',
    'isEmailVerified',
    'isAdmin',
    'isTester',
    'isDev',
    'isTeam',
    'fullName',
    'profileImageUrl',
    'metamaskWallet',
    'isMetamaskVerified',
    'googleAccount',
    'twitterHandle',
    'discordAccount',
    'lastLoginAt',
    'locale',
    'emailEssential',
    'emailMarketing',
    'cookiesEssential',
    'cookiesAnalytics',
    'cookiesFunctional',
    'cookiesTargeting',
    'agreeTos',
    'agreePrivacy',
    'agreeLegal',
    'referralCode',
    'groupId',
  ],
  PUBLIC: [
    'id',
    'userName',
    'isAdmin',
    'fullName',
    'profileImageUrl',
    'metamaskWallet',
    'isMetamaskVerified',
    'twitterHandle',
    'discordAccount',
    'referralCode',
    'isMetamaskWalletPublic',
    'isTwitterHandlePublic',
    'isDiscordAccountPublic',
  ],

  MY_ALL: undefined,
  PUBLIC_ALL: undefined,
  MY_ALL_TOKEN: undefined,
  'MY_ALL+AUTH_TOKEN': undefined,
  AUTH_GOOGLE: undefined,
  AUTH_METAMASK: undefined,
  AUTH_TOKEN: undefined,
  ALL: undefined,
});

type UserValidateField =
  | 'userName'
  | 'email'
  | 'fullName'
  | 'bio'
  | 'metamaskWallet'
  | 'twitterHandle'
  | 'emailEssential'
  | 'emailMarketing'
  | 'cookiesEssential'
  | 'cookiesAnalytics'
  | 'cookiesFunctional'
  | 'cookiesTargeting'
  | 'agreeTos'
  | 'agreePrivacy'
  | 'agreeLegal'
  | 'referralCode';

export default class User extends ModelService<UserAttribs, UserCAttribs> {
  /**
   * Options to use when fetching user information from the database
   *
   * **ALWAYS** include `id` for all models (to use the `save` method)
   */
  static FIND_OPTIONS: Record<UserFindOptionNames, FindOptions<UserAttribs>> =
    Object.freeze({
      /**
       * Options to use when not explicitly specified
       */
      DEFAULT: {
        attributes: FIND_ATTRIBS.DEFAULT,
      },
      /** Only check whether the user exists by just calling the ID */
      EXISTS: { attributes: ['id'] },
      /** Get full user information about myself */
      MY: {
        attributes: FIND_ATTRIBS.MY,
        include: [UserGroup],
      },
      /**
       * Get full user information about myself (the requesting user)
       * including "slow" fields (e.g. MYSQL TEXT type fields)
       */
      MY_ALL: {
        attributes: [
          ...(FIND_ATTRIBS.MY || []),
          'bio',
          'isDiscordAccountPublic',
          'isMetamaskWalletPublic',
          'isTwitterHandlePublic',
        ],
      },
      /**
       * Get full user information about myself (the requesting user)
       * Along with associated `UserAuth` attributes
       */
      'MY_ALL+AUTH_TOKEN': {
        attributes: [
          ...(FIND_ATTRIBS.MY || []),
          'bio',
          'isDiscordAccountPublic',
          'isMetamaskWalletPublic',
          'isTwitterHandlePublic',
        ],
        include: [
          {
            model: UserAuth,
            attributes: FIND_ATTRIBS_AUTH.TOKEN,
          },
        ],
      },
      /**
       * Get information about someone else, i.e. only the information
       * that the other user has set public
       */
      PUBLIC: {
        attributes: FIND_ATTRIBS.PUBLIC,
      },
      /**
       * Get information about someone else, i.e. only the information
       * that the other user has set public. Includes "slow" fields
       * (e.g. MYSQL TEXT type fields)
       */
      PUBLIC_ALL: {
        attributes: [...(FIND_ATTRIBS.PUBLIC || []), 'bio'],
      },
      AUTH_GOOGLE: {
        attributes: FIND_ATTRIBS.DEFAULT,
        include: [
          {
            model: UserAuth,
            attributes: FIND_ATTRIBS_AUTH.GOOGLE,
          },
        ],
      },
      AUTH_METAMASK: {
        attributes: FIND_ATTRIBS.DEFAULT,
        include: [
          {
            model: UserAuth,
            attributes: FIND_ATTRIBS_AUTH.METAMASK,
          },
        ],
      },
      /**
       * Fetch information from the associated `UserAuth` table, but only
       * select the field necessary for Sigmate token authentication.
       * Also fetch any user privilege overrides
       */
      AUTH_TOKEN: {
        attributes: FIND_ATTRIBS.DEFAULT,
        include: [
          {
            model: UserAuth,
            attributes: FIND_ATTRIBS_AUTH.TOKEN,
          },
          {
            model: Privilege,
            as: 'privileges',
            through: {
              attributes: ['grant'],
            },
          },
        ],
      },
      ALL: {},
    });

  /**
   * Returns an object structured for client response.
   * The User (service or model) instances must be pre-loaded with needed
   * attributes prior to calling this method, since this method internally
   * calls `Model.toJSON()` and does not contain any kind of DB calls
   * @param dto Array of User (service or model)
   * @returns Object containing User data formatted for client response
   */
  public static toResponse(dto: ToResponseDTO): UserResponse | null {
    const { type = 'PUBLIC', model } = dto;
    if (!model) return null;
    const j = model.toJSON();
    const k: (keyof UserResponse)[] = [];
    switch (type) {
      case 'MY':
        k.concat([
          'id',
          'userName',
          'email',
          'isEmailVerified',
          'isAdmin',
          'isTester',
          'isDev',
          'isTeam',
          'fullName',
          'bio',
          'profileImageUrl',
          'metamaskWallet',
          'isMetamaskVerified',
          'isMetamaskWalletPublic',
          'googleAccount',
          'twitterHandle',
          'isTwitterHandlePublic',
          'discordAccount',
          'isDiscordAccountPublic',
          'lastLoginAt',
          'locale',
          'emailEssential',
          'emailMarketing',
          'cookiesEssential',
          'cookiesAnalytics',
          'cookiesFunctional',
          'cookiesTargeting',
          'agreeTos',
          'agreePrivacy',
          'agreeLegal',
          'referralCode',
          'groupId',
        ]);
        break;
      case 'PUBLIC':
        k.concat([
          'id',
          'userName',
          'isAdmin',
          'fullName',
          'bio',
          'profileImageUrl',
          'isMetamaskWalletPublic',
          'isTwitterHandlePublic',
          'isDiscordAccountPublic',
        ]);
        if (j.isMetamaskVerified && j.isMetamaskWalletPublic) {
          k.push('metamaskWallet');
          k.push('isMetamaskVerified');
        }
        if (j.isTwitterHandlePublic) {
          k.push('twitterHandle');
        }
        if (j.isDiscordAccountPublic) {
          k.push('discordAccount');
        }
        break;
    }
    return pick(j, k);
  }

  name = 'USER';
  model?: UserModel;
  get serviceStatus() {
    return User.status;
  }

  constructor(options: UserOptions = {}) {
    super();
    this.model = options.user;
  }

  static async find(
    dto: UserFindDTO,
    parentAction: Action | undefined = undefined
  ) {
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
    const user = await action.run(({ transaction }) =>
      UserModel.findOne({
        where,
        transaction,
        rejectOnEmpty,
        ...User.FIND_OPTIONS[options],
      })
    );
    if (user) {
      action.setTarget({ id: user.id });
    }
    return user;
  }

  async find(dto: UserFindDTO, parentAction: Action | undefined = undefined) {
    const userModel = await User.find(dto, parentAction);
    if (userModel) this.model = userModel;
    return userModel;
  }

  static async exists(
    dto: UserExistsDTO,
    parentAction: Action | undefined = undefined
  ) {
    return await this.find({ ...dto, options: 'EXISTS' }, parentAction);
  }
  async exists(
    dto: UserExistsDTO,
    parentAction: Action | undefined = undefined
  ) {
    const user = await User.exists(dto, parentAction);
    if (user) this.model = user;
    return user;
  }

  static async create(
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

    return await action.run(async ({ action }) => {
      // Create user
      const createUser = new Action({
        type: Action.TYPE.DATABASE,
        name: 'USER_CREATE',
        target: { model: UserModel },
        parent: action,
      });
      const userModel = await createUser.run(
        async ({ transaction, action }) => {
          const user = await UserModel.create({}, { transaction });
          action.setTarget({ id: user.id });
          return user;
        }
      );
      action.setTarget({ id: userModel.id });

      // Update attribs
      if (dto.google) {
        const {
          email,
          googleAccount,
          googleAccountId,
          profileImageUrl,
          locale,
        } = dto.google;
        userModel.set('email', email);
        userModel.set('isEmailVerified', true);
        userModel.set('googleAccount', googleAccount);
        userModel.set('googleAccountId', googleAccountId);
        userModel.set('profileImageUrl', profileImageUrl);
        userModel.set('locale', locale);
      } else if (dto.metamask) {
        const { metamaskWallet, isMetamaskVerified } = dto.metamask;
        userModel.set('metamaskWallet', metamaskWallet);
        userModel.set('isMetamaskVerified', isMetamaskVerified);
      } else {
        throw new UserError({ code: 'USER/IV_CREATE_DTO' });
      }
      // Generate unique referral code
      let referralCode = '';
      let isUnique = false;
      while (!isUnique) {
        referralCode = await this.generateReferralCode();
        isUnique = await this.isReferralCodeUnique(referralCode, action);
      }
      userModel.set('referralCode', referralCode);

      // Save the updates
      const saveUser = new Action({
        type: Action.TYPE.DATABASE,
        name: 'USER_SAVE',
        target: { model: UserModel, id: userModel.id },
        parent: action,
      });
      await saveUser.run(({ transaction }) => userModel.save({ transaction }));

      // Create auth entry and associate
      const createAuth = new Action({
        type: Action.TYPE.DATABASE,
        name: 'USER_CREATE_AUTH',
        target: { model: UserAuth },
        parent: action,
      });
      await createAuth.run(async ({ transaction, action }) => {
        const auth = await UserAuth.create({}, { transaction });
        action.setTarget({ id: auth.id });
        await userModel.$set('auth', auth, { transaction });
      });
      return userModel;
    });
  }

  async create(
    dto: UserCreateDTO,
    parentAction: Action | undefined = undefined
  ) {
    const userModel = await User.create(dto, parentAction);
    this.model = userModel;
    return userModel;
  }

  async update(
    dto: UserUpdateDTO,
    parentAction: Action | undefined = undefined
  ) {
    const {
      userName,
      email,
      fullName,
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
    if (!user)
      throw new UserError({
        code: 'USER/NF',
        message: 'Failed to update user',
      });

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
        throw new UserError({ code: 'USER/RJ_UNAME_TAKEN' });
      }
      user.set('userName', userName);
      user.set('userNameUpdatedAt', new Date());
    }
    if (email !== undefined) {
      user.set('email', email);
      user.set('isEmailVerified', false);
    }
    if (fullName !== undefined) {
      user.set('fullName', fullName);
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
        throw new UserError({ code: 'USER/RJ_REF_CODE_SET' });
      } else {
        // Check if user with referral code exists
        const referredBy = await this.exists({ referralCode }, action);
        if (referredBy) {
          user.set('referredById', referredBy.id);
        } else {
          // User with given referral code does not exist
          throw new UserError({ code: 'USER/NF_REF_CODE' });
        }
      }
    }
    return await action.run(async ({ action }) => {
      const saveAction = new Action({
        type: Action.TYPE.DATABASE,
        name: 'USER_UPDATE_SAVE',
        target: { model: UserModel, id: user.id },
        parent: action,
      });
      return await saveAction.run(({ transaction }) =>
        user.save({ transaction })
      );
    });
  }

  async updateAuth(
    dto: UpdateAuthDTO,
    parentAction: Action | undefined = undefined
  ) {
    const { renew, google, metamask } = dto;
    if (!this.model) {
      throw new UserError({
        code: 'USER/NF',
        message: 'Failed to update user auth',
      });
    }

    if (!this.model.auth) {
      await this.reload({ options: 'AUTH_TOKEN' }, parentAction);
    }

    const auth = this.model?.auth;
    if (!auth)
      throw new UserError({
        code: 'USER/NF_AUTH',
        message: 'Failed to update user auth',
      });
    if (renew) {
      auth.set('sigmateAccessTokenIat', renew.sigmateAccessTokenIat);
      auth.set('sigmateRefreshTokenIat', renew.sigmateRefreshTokenIat);
    }

    if (google) {
      auth.set('googleAccessToken', google.googleAccessToken);
      if (google.googleRefreshToken !== undefined) {
        auth.set('googleRefreshToken', google.googleRefreshToken);
      }
    }
    if (metamask) {
      auth.set('metamaskNonce', metamask.nonce);
    }
    if (!renew && !google && !metamask) {
      throw new UserError({
        code: 'USER/IV_UPDATE_AUTH_DTO',
        message: 'Empty DTO',
      });
    }
    const update = new Action({
      type: Action.TYPE.DATABASE,
      name: 'USER_UPDATE_AUTH',
      target: { model: UserAuth, id: auth.id },
      parent: parentAction,
    });
    await update.run(({ transaction }) => auth.save({ transaction }));
  }

  async delete(parentAction: Action | undefined = undefined) {
    const user = this.model;
    if (!user)
      throw new UserError({ code: 'USER/NF', message: 'Delete failed' });
    const action = new Action({
      type: Action.TYPE.DATABASE,
      name: 'USER_DELETE',
      target: { model: UserModel, id: user.id },
      transaction: true,
      parent: parentAction,
    });
    await action.run(async ({ transaction }) => {
      const deleteSuffix = `$${new Date().getTime()}`;
      user.set('userName', user.userName + deleteSuffix);
      user.set('email', user.email + deleteSuffix);
      user.set('metamaskWallet', user.metamaskWallet + deleteSuffix);
      user.set('googleAccount', user.googleAccount + deleteSuffix);
      user.set('googleAccountId', user.googleAccountId + deleteSuffix);
      user.set('referralCode', user.referralCode + deleteSuffix);
      await user.save({ transaction });
      await user.destroy({ transaction });
    });
  }

  async reload(
    dto: UserReloadDTO,
    parentAction: Action | undefined = undefined
  ) {
    const user = dto.user || this.model;
    if (!user)
      throw new UserError({ code: 'USER/NF', message: 'Reload failed' });
    const options = dto.options || 'DEFAULT';
    const action = new Action({
      type: Action.TYPE.DATABASE,
      name: `USER_RELOAD (${options})`,
      target: { model: UserModel, id: user.id },
      parent: parentAction,
    });
    await action.run(async ({ transaction }) =>
      user.reload({
        ...User.FIND_OPTIONS[options],
        transaction,
      })
    );
  }

  private static async isReferralCodeUnique(
    referralCode: string,
    parentAction: Action | undefined = undefined
  ) {
    if (!referralCode) return false;
    const action = new Action({
      type: Action.TYPE.DATABASE,
      name: 'USER_IS_REFERRAL_CODE_UNIQUE',
      parent: parentAction,
    });
    const user = await action.run(() => User.exists({ referralCode }));
    return user ? false : true;
  }

  /**
   * Randomly generate a Sigmate referral code.
   * This method does **NOT** guarantee the referral code to be unique.
   * Check the database manually.
   * @returns Generated referral code
   */
  private static async generateReferralCode() {
    return new Promise<string>((resolve, reject) => {
      try {
        const code = randomInt(100000000000, 999999999999).toString();
        resolve(code);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Custom validator to check if userName follows username policy
   * @param value userName
   * @returns True if test passed, false otherwise
   */
  private static followsUserNamePolicy: CustomValidator = (value: string) => {
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

  private static isTimeDiffWithinLimits: CustomValidator = (value) => {
    // Assumes isISO8601 was run before this validator
    // i.e., value is a valid ISO8601 date

    const diff = new Date().getTime() - new Date(value).getTime();
    return 0 <= diff && diff <= 5 * 60 * 1000; // 5 minutes
  };

  public static validateOne(
    options: ValidateOneOptions<UserValidateField>
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
      case 'fullName':
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

  /**
   * Returns an object structured for client response.
   * The User (service or model) instances must be pre-loaded with needed
   * attributes prior to calling this method, since this method internally
   * calls `Model.toJSON()` and does not contain any kind of DB calls
   * @param dto UserModel instance
   * @returns Object containing User data formatted for client response
   */
  toResponse(dto: Omit<ToResponseDTO, 'model'>): UserResponse | null {
    if (!this.model) return null;
    return User.toResponse({ type: dto.type, model: this.model });
  }
}
