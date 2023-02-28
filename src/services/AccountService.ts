import { randomInt } from 'crypto';
import { DateTime, DurationLike } from 'luxon';
import { Transaction } from 'sequelize/types';
import Service from '.';
import Auth, { AuthAttribs } from '../models/user/Auth.model';
import User, { SIZE_REFERRAL, UserAttribs } from '../models/user/User.model';
import Action, { ActionArgs } from '../utils/ActionNew';
import AccountError from './errors/AccountError';

type AccountOptions = { user?: User | null };

type GoogleDTO = {
  fullName: UserAttribs['fullName'];
  googleAccount: UserAttribs['googleAccount'];
  googleAccountId: UserAttribs['googleAccountId'];
  profileImageUrl: UserAttribs['profileImageUrl'];
  locale: UserAttribs['locale'];
  googleRefreshToken: AuthAttribs['googleRefreshToken'];
  check?: boolean;
};

type CreateDTO = {
  google?: GoogleDTO;
};

type UpdateDTO = {
  fullName?: {
    value: UserAttribs['fullName'];
    check?: boolean;
  };
  google?: Omit<Partial<GoogleDTO>, 'fullName'>;
};

export default class AccountService extends Service {
  static GOOGLE_UPDATE_LIMIT: DurationLike = { weeks: 4 };
  static FULLNAME_UPDATE_LIMIT: DurationLike = { weeks: 4 };

  user?: User | null;
  constructor({ user }: AccountOptions = {}) {
    super({ name: 'Account' });
    this.user = user;
  }

  public create = Action.create(
    async (dto: ActionArgs<CreateDTO>) => {
      const { google, transaction, action } = dto;

      if (!google) {
        throw new AccountError({ code: 'ACCOUNT/IV_CREATE_DTO' });
      }

      // Referral code
      const referralCode = await this.generateUniqueReferralCode(transaction);
      const now = DateTime.utc().toJSDate();

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
            fullName,
            fullNameUpdatedAt: now,
            email: googleAccount,
            googleAccount,
            googleAccountId,
            profileImageUrl,
            googleUpdatedAt: now,
            locale,
            referralCode,
            auth: {
              googleRefreshToken,
            } as any, // create with association
          },
          {
            include: [{ model: Auth }],
            transaction,
          }
        );
        action.setTarget(user);
      } else {
        throw new AccountError({ code: 'ACCOUNT/IV_CREATE_DTO' });
      }
      this.user = user;
      return user;
    },
    {
      type: 'DATABASE',
      name: 'ACCOUNT_CREATE',
      transaction: true,
      target: 'User',
    }
  );

  public update = Action.create(
    async (args: ActionArgs<UpdateDTO>) => {
      const { fullName, google, transaction } = args;
      const user = this.user;
      let shouldUpdateUser = false;
      let shouldUpdateAuth = false;
      if (!user) throw new AccountError({ code: 'ACCOUNT/NF_USER' });
      const auth = user.auth;
      const now = DateTime.utc().toJSDate();

      if (fullName) {
        const { value, check = true } = fullName;
        user.set('fullName', value);
        if (check) {
          this.checkFullNameUpdatePolicy();
          user.set('fullNameUpdatedAt', now);
        }
      }

      if (google) {
        shouldUpdateUser = true;
        const {
          googleAccount,
          googleAccountId,
          profileImageUrl,
          locale,
          googleRefreshToken,
          check = true,
        } = google;

        if (check) {
          this.checkGoogleUpdatePolicy();
          user.set('googleUpdatedAt', now);
        }

        if (googleAccount !== undefined) {
          user.set('googleAccount', googleAccount);
        }
        if (googleAccountId !== undefined) {
          user.set('googleAccountId', googleAccountId);
        }
        if (profileImageUrl !== undefined) {
          user.set('profileImageUrl', profileImageUrl);
        }
        if (locale !== undefined) {
          user.set('locale', locale);
        }
        if (googleRefreshToken !== undefined) {
          shouldUpdateAuth = true;
          if (!auth) throw new AccountError({ code: 'ACCOUNT/NF_AUTH' });
          auth.set('googleRefreshToken', googleRefreshToken);
        }
      }

      if (shouldUpdateUser) await user.save({ transaction });
      if (shouldUpdateAuth && auth) await auth.save({ transaction });

      return user;
    },
    { type: 'DATABASE', name: 'ACCOUNT_UPDATE', target: 'User' }
  );

  private checkGoogleUpdatePolicy() {
    const user = this.user;
    if (!user) throw new AccountError({ code: 'ACCOUNT/NF_USER' });
    if (user.googleUpdatedAt) {
      const now = DateTime.utc();
      const canUpdateAfter = DateTime.fromJSDate(user.googleUpdatedAt).plus(
        AccountService.GOOGLE_UPDATE_LIMIT
      );
      if (now < canUpdateAfter) {
        throw new AccountError({ code: 'ACCOUNT/CF_POLICY/GOOGLE_UPDATE' });
      }
    }
  }

  private checkFullNameUpdatePolicy() {
    const user = this.user;
    if (!user) throw new AccountError({ code: 'ACCOUNT/NF_USER' });
    if (user.fullNameUpdatedAt) {
      const now = DateTime.utc();
      const canUpdateAfter = DateTime.fromJSDate(user.fullNameUpdatedAt).plus(
        AccountService.FULLNAME_UPDATE_LIMIT
      );
      if (now < canUpdateAfter) {
        throw new AccountError({ code: 'ACCOUNT/CF_POLICY/FULLNAME_UPDATE' });
      }
    }
  }

  private async generateUniqueReferralCode(
    transaction: Transaction | undefined
  ) {
    let referralCode = this.generateReferralCode();
    while (User.findOne({ where: { referralCode }, transaction })) {
      referralCode = this.generateReferralCode();
    }
    return referralCode;
  }

  /** Generate a new referral code randomly */
  private generateReferralCode() {
    const first = randomInt(4, 9);
    const second = SIZE_REFERRAL - first - 1;
    return (
      randomInt(10 ** first, 10 ** (first + 1) - 1) +
      '-' +
      randomInt(10 ** second, 10 ** (second + 1) - 1)
    );
  }
}
