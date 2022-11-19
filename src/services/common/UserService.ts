import { randomBytes } from 'crypto';
import { Transaction, WhereOptions } from 'sequelize/types';
import services from '..';
import User, { UserAttribs, UserCAttribs } from '../../models/User.model';
import UserAuth, { UserAuthAttribs } from '../../models/UserAuth.model';
import UserGroup from '../../models/UserGroup.model';
import AuthService from './auth/AuthService';
import BaseService from './base/BaseService';
import AuthError from './errors/AuthError';

export interface UserFindDTO
  extends Partial<
    Pick<
      UserAttribs,
      'id' | 'userName' | 'googleAccountId' | 'referralCode' | 'metamaskWallet'
    >
  > {
  sigmateAccessToken?: string;
  sigmateRefreshToken?: string;
}

type UserCreateDTO = Pick<
  UserCAttribs,
  | 'email'
  | 'displayName'
  | 'profileImageUrl'
  | 'metamaskWallet'
  | 'googleAccount'
  | 'googleAccountId'
  | 'locale'
> &
  Pick<
    UserAuthAttribs,
    'googleAccessToken' | 'googleRefreshToken' | 'metamaskNonce'
  >;

type UserUpdateDTO = Pick<
  UserAttribs,
  | 'userName'
  | 'googleAccount'
  | 'profileImageUrl'
  | 'metamaskWallet'
  | 'isMetamaskVerified'
  | 'referredBy'
  | 'referredById'
  | 'agreeTos'
  | 'agreePrivacy'
  | 'agreeLegal'
> &
  Pick<
    UserAuthAttribs,
    'googleAccessToken' | 'googleRefreshToken' | 'metamaskNonce'
  >;

export default class UserService extends BaseService {
  user?: User;
  constructor(user: User | null | undefined = undefined) {
    super();
    this.user = user || undefined;
  }

  /**
   * Find a user
   * @param dto Object containing an attribute to uniquely identify a user
   * @returns User instance
   */
  public async find(
    dto: UserFindDTO,
    options: { set?: boolean } | undefined = undefined
  ) {
    const { id, userName, googleAccountId, referralCode, metamaskWallet } = dto;
    let user: User | null = null;
    if (id) {
      user = await this.findById(id);
    } else if (userName) {
      user = await this.findByAttrib({ userName });
    } else if (googleAccountId) {
      user = await this.findByAttrib({ googleAccountId });
    } else if (referralCode) {
      user = await this.findByAttrib({ referralCode });
    } else if (metamaskWallet) {
      user = await this.findByAttrib({ metamaskWallet });
    } else {
      throw new AuthError('USER/FIND');
    }
    if (options?.set && user) this.user = user;
    return user;
  }

  private async findById(id: UserAttribs['id']) {
    return await services.db.run(() =>
      User.findByPk(id, AuthService.USER_SELECT_OPTIONS)
    );
  }

  private async findByAttrib(where: WhereOptions<UserAttribs>) {
    return await services.db.run(() =>
      User.findOne({ where, ...AuthService.USER_SELECT_OPTIONS })
    );
  }

  private async isReferralCodeUnique(
    referralCode: string,
    transaction: Transaction | undefined = undefined
  ) {
    const user = await services.db.run(() =>
      User.findOne({ where: { referralCode }, transaction })
    );
    return user === null ? true : false;
  }

  /**
   * Randomly generate a Sigmate referral code.
   * This method does **NOT** guarantee the referral code to be unique.
   * Check the database manually.
   * @returns Generated referral code
   */
  private async generateReferralCode() {
    return new Promise<string>((resolve, reject) => {
      randomBytes(6, (err, buf) => {
        if (err) reject(err);
        resolve(buf.toString('hex'));
      });
    });
  }

  public async create(dto: UserCreateDTO) {
    const user = await services.db.transaction(async (transaction) => {
      // Generate referral code
      let referralCode = '';
      let isReferralCodeUnique = false;
      while (!isReferralCodeUnique) {
        // Retry generating if the referralCode is not unique
        referralCode = await this.generateReferralCode();
        isReferralCodeUnique = await this.isReferralCodeUnique(
          referralCode,
          transaction
        );
      }

      const auth = await services.db.run(() =>
        UserAuth.create(
          {
            googleAccessToken: dto.googleAccessToken,
            googleRefreshToken: dto.googleRefreshToken,
            metamaskNonce: dto.metamaskNonce,
          },
          { transaction }
        )
      );

      const [group] = await services.db.run(() =>
        UserGroup.findOrCreate({
          where: { name: 'newbie' },
          defaults: { name: 'newbie' },
          transaction,
        })
      );

      const user = await services.db.run(() =>
        User.create(
          {
            email: dto.email,
            isAdmin: false,
            displayName: dto.displayName,
            profileImageUrl: dto.profileImageUrl,
            metamaskWallet: dto.metamaskWallet,
            googleAccount: dto.googleAccount,
            googleAccountId: dto.googleAccountId,
            locale: dto.locale,
            referralCode,
            groupId: group.id,
            authId: auth.id,
          },
          { transaction, include: [UserAuth] }
        )
      );

      return user;
    });

    this.user = user;
    return user;
  }

  public async update(
    dto: UserUpdateDTO,
    transaction: Transaction | undefined = undefined
  ) {
    if (!this.user?.auth) throw new AuthError('USER/UNAUTHENTICATED');
    const user = this.user;
    const auth = this.user.auth;

    if (dto.userName) {
      user.set('userName', dto.userName);
      user.set('userNameUpdatedAt', new Date());
    }

    if (dto.googleAccount !== undefined) {
      user.set('googleAccount', dto.googleAccount);
    }

    if (dto.profileImageUrl !== undefined) {
      user.set('profileImageUrl', dto.profileImageUrl);
    }

    if (dto.metamaskWallet) {
      user.set('metamaskWallet', dto.metamaskWallet);
      user.set('isMetamaskVerified', dto.isMetamaskVerified || false);
    }

    if (dto.referredById !== undefined || dto.referredBy !== undefined) {
      const referredBy = await user.$count('referredBy', { transaction });
      if (referredBy) throw new AuthError('USER/CONFLICT/REFERRAL');
      user.set('referredById', dto.referredById || dto.referredBy?.id);
    }

    if (dto.agreeTos !== undefined) {
      user.set('agreeTos', new Date());
    }

    if (dto.agreePrivacy !== undefined) {
      user.set('agreePrivacy', new Date());
    }

    if (dto.agreeLegal !== undefined) {
      user.set('agreeLegal', new Date());
    }

    if (dto.googleAccessToken !== undefined) {
      auth.set('googleAccessToken', dto.googleAccessToken);
    }

    if (dto.googleRefreshToken !== undefined) {
      auth.set('googleRefreshToken', dto.googleRefreshToken);
    }

    if (dto.metamaskNonce !== undefined) {
      auth.set('metamaskNonce', dto.metamaskNonce);
    }

    await services.db.run(() => user.save({ transaction }));
    await services.db.run(() => auth.save({ transaction }));
  }
}
