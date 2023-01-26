import { randomInt } from 'crypto';
import { Transaction } from 'sequelize/types';
import Service from '.';
import Auth, { AuthAttribs } from '../models/user/Auth.model';
import User, { SIZE_REFERRAL, UserAttribs } from '../models/user/User.model';
import Action, { ActionWorkerOptions } from '../utils/Action';
import AccountError from './errors/AccountError';

type CreateDTO = {
  google?: {
    googleAccount: NonNullable<UserAttribs['googleAccount']>;
    googleAccountId: NonNullable<UserAttribs['googleAccountId']>;
    profileImageUrl: UserAttribs['profileImageUrl'];
    locale: UserAttribs['locale'];
    googleAccessToken: NonNullable<AuthAttribs['googleAccessToken']>;
    googleRefreshToken: AuthAttribs['googleRefreshToken'];
  };
};

export default class AccountService extends Service {
  user?: User;
  constructor({ user }: { user?: User } = {}) {
    super({ name: 'Account' });
    this.user = user;
  }

  public create = Action.create(
    async (dto: CreateDTO, { transaction }: ActionWorkerOptions) => {
      const { google } = dto;

      if (!google) {
        throw new AccountError({ code: 'ACCOUNT/IV_CREATE_DTO' });
      }

      // Referral code
      const referralCode = await this.generateUniqueReferralCode(transaction);

      let user: User;
      if (google) {
        const {
          googleAccount,
          googleAccountId,
          profileImageUrl,
          locale,
          googleAccessToken,
          googleRefreshToken,
        } = google;
        user = await User.create(
          {
            email: googleAccount,
            googleAccount,
            googleAccountId,
            profileImageUrl,
            locale,
            referralCode,
            auth: {
              googleAccessToken,
              googleRefreshToken,
            } as any, // create with association
          },
          {
            include: [
              {
                model: Auth,
              },
            ],
            transaction,
          }
        );
      } else {
        throw new AccountError({ code: 'ACCOUNT/IV_CREATE_DTO' });
      }
      this.user = user;
      return user;
    },
    { name: 'ACCOUNT_CREATE', transaction: true }
  );

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
