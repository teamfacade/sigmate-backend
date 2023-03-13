import { randomBytes, randomInt } from 'crypto';
import { DateTime, DurationLike } from 'luxon';
import { generateSlug, RandomWordOptions } from 'random-word-slugs';
import Service from '.';
import AccountError from '../errors/account';
import User, {
  SIZE_REFERRAL,
  SIZE_USERNAME,
  UserAttribs,
  UserCAttribs,
} from '../models/User.model';
import UserAuth, { UserAuthAttribs } from '../models/UserAuth.model';
import { ActionArgs, ActionMethod } from '../utils/action';
import { googleAuth } from './auth/google';

type GoogleDTO = {
  fullName: UserAttribs['fullName'];
  googleAccount: UserAttribs['googleAccount'];
  googleAccountId: UserAttribs['googleAccountId'];
  profileImageUrl: UserAttribs['profileImageUrl'];
  locale: UserAttribs['locale'];
  googleRefreshToken?: UserAuthAttribs['googleRefreshToken'];
};

type CreateDTO = {
  google?: GoogleDTO;
};

type UpdateDTO = {
  user: User | null | undefined;
  attribs: Partial<
    Pick<
      UserAttribs,
      | 'userName'
      | 'fullName'
      | 'bio'
      | 'email'
      | 'isGooglePublic'
      | 'isTwitterPublic'
      | 'isDiscordPublic'
      | 'isMetamaskPublic'
      | 'locale'
    >
  > & {
    referredByCode?: UserAttribs['referralCode'];
    agreeTos?: boolean;
    agreeLegal?: boolean;
    agreePrivacy?: boolean;
  };
};

export default class AccountService extends Service {
  private USERNAME_SLUG_OPTIONS: Readonly<RandomWordOptions<2>> = {
    format: 'lower',
    partsOfSpeech: ['adjective', 'noun'],
    categories: {
      adjective: [
        'appearance',
        'color',
        'condition',
        'quantity',
        'shapes',
        'size',
        'sounds',
        'taste',
        'time',
        'touch',
      ],
      noun: [
        'animals',
        'business',
        'education',
        'family',
        'food',
        'health',
        'media',
        'place',
        'profession',
        'science',
        'sports',
        'technology',
        'thing',
        'time',
        'transportation',
      ],
    },
  };

  static EMAIL_REGEX = /(?<id>.*)@(?<domain>.*)/;
  static USERNAME_REGEX = {
    beginsOrEndsWithSpChars: /^[^\w]|[^\w]$/,
    consecutiveSpChars: /[^\w]{2,}/,
    illegalChars: /[^\w.-]/,
  };

  /** Prevent users from changing usernames too often */
  static INTERVAL_USERNAME_CHANGE: DurationLike = { week: 2 };
  /** Allow users to change username within this time period */
  static GRACE_USERNAME_CHANGE: DurationLike = { minutes: 3 };
  static SIZE_USERNAME_RANDOM_SUFFIX = 6;
  static SIZE_USERNAME_MIN = 3;

  constructor() {
    super('Account');
  }

  @ActionMethod('ACCOUNT/CREATE')
  public async create(args: CreateDTO & ActionArgs) {
    const { google, transaction, action } = args;
    const referralCode = await this.generateUniqueReferralCodeV1({
      parentAction: action,
    });

    let userAttribs: UserCAttribs;
    if (google) {
      const {
        fullName,
        googleAccount,
        googleAccountId,
        profileImageUrl,
        locale,
        googleRefreshToken,
      } = google;

      // Generate username based on the email address
      const { id: base } = this.parseEmail(googleAccount);
      const userName = await this.generateUniqueUserName({
        base,
        parentAction: action,
      });

      userAttribs = {
        userName,
        fullName,
        email: googleAccount,
        isEmailVerified: true,
        googleAccount,
        googleAccountId,
        isGooglePublic: false,
        profileImageUrl,
        locale,
        referralCode,
        auth: {
          googleRefreshToken,
        } as any, // create with association
      };
    } else {
      throw new AccountError('ACCOUNT/IV_CREATE_DTO');
    }

    this.checkUserNamePolicy(userAttribs.userName);

    const user = await User.create(userAttribs, {
      include: [{ model: UserAuth }],
      transaction,
    });

    action?.addTarget(user);
    return user;
  }

  @ActionMethod('ACCOUNT/UPDATE')
  public async update(args: UpdateDTO & ActionArgs) {
    const { user, attribs, transaction } = args;
    if (!user) throw new AccountError('ACCOUNT/RJ_UNAUTHENTICATED');
    const {
      userName,
      fullName,
      bio,
      email,
      isGooglePublic,
      isTwitterPublic,
      isDiscordPublic,
      isMetamaskPublic,
      locale,
      referredByCode,
      agreeTos,
      agreeLegal,
      agreePrivacy,
    } = attribs;

    // Only run when the username changes
    if (userName !== undefined && userName !== user.userName) {
      this.checkUserNamePolicy(userName);
      this.checkCanChangeUserName(user);
      await this.checkUserNameAvailability({ userName, throws: true });

      user.set('userName', userName);
      user.set('userNameUpdatedAt', DateTime.now().toJSDate());
    }

    if (fullName !== undefined) {
      user.set('fullName', fullName);
      user.set('fullNameUpdatedAt', DateTime.now().toJSDate());
    }

    if (bio !== undefined) {
      user.set('bio', bio);
    }

    if (email !== undefined) {
      user.set('email', email);
      user.set('emailUpdatedAt', DateTime.now().toJSDate());
      user.set('isEmailVerified', email ? false : undefined);
    }

    if (isGooglePublic !== undefined) {
      user.set('isGooglePublic', isGooglePublic);
    }

    if (isTwitterPublic !== undefined) {
      user.set('isTwitterPublic', isTwitterPublic);
    }

    if (isDiscordPublic !== undefined) {
      user.set('isDiscordPublic', isDiscordPublic);
    }

    if (isMetamaskPublic !== undefined) {
      user.set('isMetamaskPublic', isMetamaskPublic);
    }

    if (locale !== undefined) {
      user.set('locale', locale);
    }

    if (referredByCode !== undefined) {
      if (user.referredBy) {
        throw new AccountError('ACCOUNT/RJ_REFERRAL_ALREADY_SET');
      }
      const referredBy = await User.findOne({
        where: { referralCode: referredByCode },
        attributes: [...User.ATTRIB_PUBLIC],
        transaction,
      });
      if (!referredBy) {
        throw new AccountError('ACCOUNT/IV_REFERRAL_CODE');
      }
      user.referredBy = referredBy;
      user.set('referredById', referredBy.id);
    }

    if (agreeTos !== undefined) {
      user.set('agreeTos', agreeTos ? DateTime.now().toJSDate() : undefined);
    }

    if (agreeLegal !== undefined) {
      user.set(
        'agreeLegal',
        agreeLegal ? DateTime.now().toJSDate() : undefined
      );
    }

    if (agreePrivacy !== undefined) {
      user.set(
        'agreePrivacy',
        agreePrivacy ? DateTime.now().toJSDate() : undefined
      );
    }

    await user.save({ transaction });
    return user;
  }

  @ActionMethod('ACCOUNT/CONNECT_GOOGLE')
  public async connectGoogle(
    args: {
      user: User;
      google: Omit<GoogleDTO, 'fullName' | 'locale'>;
    } & ActionArgs
  ) {
    const { user, google, transaction } = args;
    const {
      googleAccount,
      googleAccountId,
      profileImageUrl,
      googleRefreshToken,
    } = google;

    user.set('googleAccount', googleAccount);
    user.set('googleAccountId', googleAccountId);
    user.set('googleUpdatedAt', DateTime.now().toJSDate());
    user.set('profileImageUrl', profileImageUrl);
    user.set('isGooglePublic', false);
    if (user.email) {
      if (user.email === googleAccount) {
        user.set('isEmailVerified', true);
      }
    } else {
      user.set('email', googleAccount);
      user.set('emailUpdatedAt', undefined);
      user.set('isEmailVerified', true);
    }

    const auth = user.auth || (await user.$get('auth', { transaction }));
    if (!auth) throw new AccountError('ACCOUNT/NF_AUTH');
    auth.set('googleRefreshToken', googleRefreshToken);

    await user.save({ transaction });
    await auth.save({ transaction });

    return user;
  }

  @ActionMethod('ACCOUNT/CHECK_USERNAME')
  public async checkUserNameAvailability(
    args: { userName: string; throws?: boolean } & ActionArgs
  ) {
    const { userName, throws = true, transaction } = args;
    const user = await User.findOne({ where: { userName }, transaction });
    if (user) {
      if (throws) {
        throw new AccountError('ACCOUNT/IV_USERNAME_TAKEN');
      } else {
        return false;
      }
    }
    return true;
  }

  @ActionMethod('ACCOUNT/CHECK_REFERRAL')
  public async checkReferralCode(
    args: { referralCode: string; throws?: boolean } & ActionArgs
  ) {
    const { referralCode, throws = true, transaction } = args;
    const user = await User.findOne({ where: { referralCode }, transaction });
    if (!user) {
      if (throws) {
        throw new AccountError('ACCOUNT/IV_REFERRAL_CODE');
      } else {
        return false;
      }
    }
    return true;
  }

  @ActionMethod('ACCOUNT/DELETE')
  public async delete(args: { user: User } & ActionArgs) {
    const { user, action, transaction } = args;

    // Revoke connected accounts
    const auth = user.auth;
    if (!auth) throw new AccountError('ACCOUNT/NF_AUTH');
    if (auth.googleRefreshToken) {
      await googleAuth.revoke({
        googleRefreshToken: auth.googleRefreshToken,
        parentAction: action,
      });
    }

    // Revoke all sigmate tokens and nonces
    auth.set('accessNonce', null);
    auth.set('refreshNonce', null);
    auth.set('googleRefreshToken', null);
    auth.set('metamaskNonce', null);
    auth.set('metamaskNonceCreatedAt', null);
    await auth.save({ transaction });

    // Soft delete user from DB
    await user.destroy({ transaction });
  }

  private checkCanChangeUserName(user: User | null | undefined, throws = true) {
    try {
      if (!user) {
        throw new AccountError('ACCOUNT/RJ_UNAUTHENTICATED');
      }

      // Cannot change usernames too often
      if (user.userNameUpdatedAt) {
        const userNameUpdatedAt = DateTime.fromJSDate(user.userNameUpdatedAt);
        const now = DateTime.now();
        // Prevent users from changing username too often
        const canUpdateFrom = userNameUpdatedAt.plus(
          AccountService.INTERVAL_USERNAME_CHANGE
        );
        // However, for a short period of time, the user can change their usernames again
        // to allow for them to handle mistakes
        const gracePeriod = userNameUpdatedAt.plus(
          AccountService.GRACE_USERNAME_CHANGE
        );
        if (now > gracePeriod && now < canUpdateFrom) {
          throw new AccountError({
            code: 'ACCOUNT/RJ_USERNAME_CHANGE_INTERVAL',
            message: 'Usernames can only be changed every 2 weeks',
          });
        }
      }
      // TODO check authorization
    } catch (error) {
      if (throws) throw error;
      if (error instanceof AccountError) {
        return error.code;
      }
      return 'ER/OTHER';
    }
  }

  /**
   * Check if the given username follows the username policy
   * @param userName String to check
   * @param throws If set to `true`, throw on failure. If not, return a string containing the error code on failure, and an empty string on success.
   * @returns An empty string if check was successful
   */
  public checkUserNamePolicy(userName: string, throws = true): boolean {
    try {
      if (!userName) throw new AccountError('ACCOUNT/IV_USERNAME_EMPTY');
      if (userName.length < AccountService.SIZE_USERNAME_MIN) {
        throw new AccountError({
          code: 'ACCOUNT/IV_USERNAME_TOO_SHORT',
          message: `Must be longer than ${AccountService.SIZE_USERNAME_MIN} characters`,
        });
      }
      if (userName.length > SIZE_USERNAME) {
        throw new AccountError({
          code: 'ACCOUNT/IV_USERNAME_TOO_LONG',
          message: `Must be shorter than ${SIZE_USERNAME} characters`,
        });
      }
      const illegalChars =
        AccountService.USERNAME_REGEX.illegalChars.exec(userName);
      if (illegalChars) {
        throw new AccountError({
          code: 'ACCOUNT/IV_USERNAME_ILLEGAL_CHARS',
          message: `Remove "${illegalChars[0]}"`,
        });
      }
      // TODO illegal words

      const consecutiveSpChars =
        AccountService.USERNAME_REGEX.consecutiveSpChars.exec(userName);
      if (consecutiveSpChars) {
        throw new AccountError('ACCOUNT/IV_USERNAME_CONSEC_SPECIAL_CHARS');
      }

      const beginsOrEndsWithSpChars =
        AccountService.USERNAME_REGEX.beginsOrEndsWithSpChars.exec(userName);
      if (beginsOrEndsWithSpChars) {
        throw new AccountError(
          'ACCOUNT/IV_USERNAME_BEGINS_OR_ENDS_WITH_SPECIAL_CHARS'
        );
      }
      return true;
    } catch (error) {
      if (throws) throw error;
      return false;
    }
  }

  /**
   * Parse an email address to an id and domain
   * @param email Email address
   * @returns Parsed email separated into id and domain
   */
  private parseEmail(email: string | null | undefined) {
    let id = '';
    let domain = '';
    if (email) {
      const match = AccountService.EMAIL_REGEX.exec(email);
      if (match && match.groups) {
        id = match.groups.id;
        domain = match.groups.domain;
      }
    }
    return { id, domain };
  }

  /**
   * Sanitize a given string so that it can be used as a valid username.
   * Sanitization occurs in the following order:
   * 1. Invalid characters are replaced with `-`.
   * 1. Consecutive special characters will be replaced with a single occurence of that character
   * 1. Names will be sliced to fit the length limit of usernames
   *
   * @param userName String to sanitize
   * @param lengthLimitWithSuffix If set to true, slice the given string to a length that can fit into the username size limit even when a random suffix is appended to the end. Setting this option does not append a random suffix to the end.
   * @returns Sanitized string
   */
  private sanitizeUserName(userName: string, lengthLimitWithSuffix = false) {
    // Replace invalid characters
    let sanitized = userName.replace(/[^\w-.]/g, '-');

    // Consecutive special characters
    sanitized = sanitized.replace(/-{2,}/g, '-');
    sanitized = sanitized.replace(/_{2,}/g, '_');
    sanitized = sanitized.replace(/\.{2,}/g, '.');

    // Slice to fit length limit
    let lengthLimit = SIZE_USERNAME;
    if (lengthLimitWithSuffix) {
      lengthLimit -= AccountService.SIZE_USERNAME_RANDOM_SUFFIX + 1;
    }
    if (sanitized.length > lengthLimit) {
      sanitized = sanitized.slice(0, lengthLimit);
    }
    return sanitized;
  }

  /**
   * Generate a string that can be used as a valid default username, that is also unique across the service
   * @param args.base String to use as the starting portion of a username. Randomly generated if not provided
   * @returns A valid, unique username
   */
  @ActionMethod('ACCOUNT/GEN_USERNAME')
  private async generateUniqueUserName(
    args: { base?: string } & ActionArgs = {}
  ) {
    // New userName: BASE-SUFFIX

    // Use the provided base, or randomly generate one if not provided
    const { base, transaction } = args;
    let userName: string;
    if (base) {
      userName = this.sanitizeUserName(base);
    } else {
      userName = this.generateUserName();
    }

    // Check if the username is unique, and if not, repeat until it is
    let user: User | null = await User.findOne({
      where: { userName },
      transaction,
    });
    while (user) {
      userName = this.generateUserName(base);
      user = await User.findOne({ where: { userName }, transaction });
    }
    return userName;
  }

  /**
   * Generate a string that can be used as a valid default username
   * @param base String to use as the starting portion of a username. Randomly generated if not provided
   * @returns Valid username (NOT checked for uniqueness)
   */
  private generateUserName(base?: string) {
    // Base: the starting portion of a username
    let userName = base;
    // Generate one if not provided
    if (!userName) {
      userName = generateSlug(2, this.USERNAME_SLUG_OPTIONS);
    }

    // Make the base a valid username
    userName = this.sanitizeUserName(userName, true);

    // Add a random suffix
    const suffixSize = Math.floor(
      AccountService.SIZE_USERNAME_RANDOM_SUFFIX / 2
    );
    userName += '-' + randomBytes(suffixSize).toString('hex');

    return userName;
  }

  /**
   * Generate a random referral code for a new user
   * @returns Referral code
   */
  @ActionMethod('ACCOUNT/GEN_REFERRAL_CODE')
  private async generateUniqueReferralCodeV1(args: ActionArgs = {}) {
    const { transaction } = args;
    let referralCode = '';
    let user: User | null = null;
    while (!referralCode || user) {
      referralCode = this.generateReferralCodeV1();
      user = await User.findOne({ where: { referralCode }, transaction });
    }
    return referralCode;
  }

  /** Generate a new referral code randomly */
  private generateReferralCodeV1() {
    if (SIZE_REFERRAL > 15) {
      // Number.MAX_SAFE_INTEGER is 16 digits long
      throw new Error('Referral code algorithm unsafe');
    }
    return randomInt(
      10 ** SIZE_REFERRAL,
      10 ** (SIZE_REFERRAL + 1) - 1
    ).toString();
  }
}

export const account = new AccountService();
