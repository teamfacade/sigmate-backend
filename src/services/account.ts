import { randomBytes, randomInt } from 'crypto';
import { generateSlug, RandomWordOptions } from 'random-word-slugs';
import Service from '.';
import AccountError from '../errors/account';
import User, { UserAttribs } from '../models/User.model';
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
  private USERNAME_SLUG_OPTIONS: Readonly<RandomWordOptions<3>> = {
    format: 'lower',
    partsOfSpeech: ['adjective', 'adjective', 'noun'],
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

  constructor() {
    super('Account');
  }

  @ActionMethod('ACCOUNT/CREATE')
  public async create(args: CreateDTO & ActionArgs) {
    const { google, transaction, action } = args;
    const userName = this.generateUsername();
    const referralCode = await this.generateUniqueReferralCode();

    let user: User;
    if (google) {
      const {
        fullName,
        googleAccount,
        googleAccountId,
        profileImageUrl,
        locale,
        googleRefreshToken,
      } = google;

      user = await User.create(
        {
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
        },
        {
          include: [{ model: UserAuth }],
          transaction,
        }
      );
    } else {
      throw new AccountError('ACCOUNT/IV_CREATE_DTO');
    }
    action?.addTarget(user);
    return user;
  }

  @ActionMethod('ACCOUNT/GEN_REFERRAL_CODE')
  private async generateUniqueReferralCode(args: ActionArgs = {}) {
    const { transaction } = args;
    let referralCode = '';
    let user: User | null = null;
    while (!referralCode || user) {
      referralCode = this.generateReferralCode();
      user = await User.findOne({ where: { referralCode }, transaction });
    }
    return referralCode;
  }

  /** Generate a new referral code randomly */
  private generateReferralCode() {
    return randomInt(10 ** 10, 10 ** 11 - 1).toString();
  }

  private generateUsername() {
    let userName = generateSlug(3, this.USERNAME_SLUG_OPTIONS);
    userName = userName.replace(/\s/g, '-');
    userName += '-' + randomBytes(4).toString('hex');
    return userName;
  }
}

export const account = new AccountService();
