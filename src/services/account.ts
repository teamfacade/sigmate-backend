import { randomBytes, randomInt } from 'crypto';
import { generateSlug, RandomWordOptions } from 'random-word-slugs';
import Service from '.';
import AccountError, { AccountErrorCode } from '../errors/account';
import User, {
  SIZE_USERNAME,
  UserAttribs,
  UserCAttribs,
} from '../models/User.model';
import UserAuth, { UserAuthAttribs } from '../models/UserAuth.model';
import { ActionArgs, ActionMethod } from '../utils/action';

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
  static SIZE_USERNAME_RANDOM_SUFFIX = 6;
  static SIZE_USERNAME_MIN = 3;

  constructor() {
    super('Account');
  }

  @ActionMethod('ACCOUNT/CREATE')
  public async create(args: CreateDTO & ActionArgs) {
    const { google, transaction, action } = args;
    const referralCode = await this.generateUniqueReferralCodeV1();

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
      const userName = await this.generateUniqueUserName({ base, transaction });

      userAttribs = {
        userName,
        fullName,
        email: googleAccount,
        isEmailVerified: true,
        googleAccount,
        googleAccountId,
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

  /**
   * Check if the given username follows the username policy
   * @param userName String to check
   * @param throws If set to `true`, throw on failure. If not, return a string containing the error code on failure, and an empty string on success.
   * @returns An empty string if check was successful
   */
  private checkUserNamePolicy(
    userName: string,
    throws = true
  ): AccountErrorCode | 'ER/OTHER' | '' {
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
      return '';
    } catch (error) {
      if (throws) throw error;
      if (error instanceof AccountError) {
        return error.code;
      }
      return 'ER/OTHER';
    }
  }

  /**
   * Parse an email address to an id and domain
   * @param email Email address
   * @returns Parsed email separated into id and domain
   */
  private parseEmail(email: string | undefined) {
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
    return randomInt(10 ** 10, 10 ** 11 - 1).toString();
  }
}

export const account = new AccountService();
