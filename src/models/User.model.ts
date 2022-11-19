import {
  Table,
  Model,
  Unique,
  Column,
  DataType,
  AllowNull,
  Default,
  Length,
  IsEmail,
  Is,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import isLocale from 'validator/lib/isLocale';
import Device from './Device.model';
import UserAuth, { UserAuthAttribs } from './UserAuth.model';
import UserDevice from './UserDevice.model';
import UserGroup from './UserGroup.model';

const USER_USERNAME_MIN_LENGTH = 3;
const USER_USERNAME_MAX_LENGTH = 15;
const USER_METAMASK_MAX_LENGTH = 64;
const USER_GOOGLE_ID_LENGTH = 32; // 22 (for future-proof)
const USER_REFERRAL_CODE_LENGTH = 15;
// A dollar sign followed by UNIX epoch timestamp
// e.g. email@email.com$1668133802617
const USER_DELETE_SUFFIX_LENGTH = 14;

export interface UserAttribs {
  /** Primary key */
  id: number;

  userName?: string;
  userNameUpdatedAt?: Date;
  email?: string;
  isEmailVerified: boolean;
  isAdmin: boolean;

  // Profile
  displayName?: string;
  bio?: string;
  profileImageUrl?: string; // external image
  // profileImage?: any; // TODO uploaded image

  metamaskWallet?: string;
  isMetamaskVerified?: boolean;
  googleAccount?: string;
  /** ID for Google OAuth */
  googleAccountId?: string;
  twitterHandle?: string;
  discordAccount?: string;

  isMetamaskWalletPublic: boolean;
  isTwitterHandlePublic: boolean;
  isDiscordAccountPublic: boolean;

  lastLoginAt?: Date;
  /** Preferred locale/language settings */
  locale?: string;

  emailEssential: boolean;
  emailMarketing: boolean;
  cookiesEssential: boolean;
  cookiesAnalytics: boolean;
  cookiesFunctional: boolean;
  cookiesTargeting: boolean;
  /** Timestamp when the user last agreed to terms of service */
  agreeTos?: Date;
  /** Timestamp when the user last agreed to privacy policy */
  agreePrivacy?: Date;
  /** Timestamp when the user last agreed to legal disclaimer */
  agreeLegal?: Date;

  /** My referral code */
  referralCode?: string;
  /** Referral code of someone else */
  referredBy?: User;
  referredById?: UserAttribs['id'];

  /** Users who entered my referral code */
  referredUsers?: User[];

  devices?: Device[];
  group?: UserGroup;
  groupId?: number;
  auth?: UserAuth;
  authId?: UserAuthAttribs['id'];
}

export type UserCAttribs = Optional<
  UserAttribs,
  | 'id'
  | 'isEmailVerified'
  | 'isAdmin'
  | 'isMetamaskWalletPublic'
  | 'isTwitterHandlePublic'
  | 'isDiscordAccountPublic'
  | 'emailEssential'
  | 'emailMarketing'
  | 'cookiesEssential'
  | 'cookiesAnalytics'
  | 'cookiesFunctional'
  | 'cookiesTargeting'
>;

@Table({
  modelName: 'User',
  tableName: 'users',
  underscored: true,
  timestamps: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
  engine: 'InnoDB',
})
export default class User extends Model<UserAttribs, UserCAttribs> {
  @Unique('userName')
  @Length({
    msg: 'LENGTH',
    min: USER_USERNAME_MIN_LENGTH,
    max: USER_USERNAME_MAX_LENGTH + USER_DELETE_SUFFIX_LENGTH,
  })
  @Column(DataType.STRING(USER_USERNAME_MAX_LENGTH + USER_DELETE_SUFFIX_LENGTH))
  userName: UserAttribs['userName'];

  @Column(DataType.DATE)
  userNameUpdatedAt: UserAttribs['userNameUpdatedAt'];

  @Unique('email')
  @IsEmail
  @Length({
    msg: 'LENGTH',
    max: 255 - USER_DELETE_SUFFIX_LENGTH,
  })
  @Column(DataType.STRING(255))
  email: UserAttribs['email'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isEmailVerified!: UserAttribs['isEmailVerified'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isAdmin!: UserAttribs['isAdmin'];

  @Column(DataType.STRING)
  displayName: UserAttribs['displayName'];

  @Column(DataType.TEXT)
  bio: UserAttribs['bio'];

  @Column(DataType.STRING(1024))
  profileImageUrl: UserAttribs['profileImageUrl'];

  @Unique('metamaskWallet')
  @Column(DataType.STRING(USER_METAMASK_MAX_LENGTH))
  metamaskWallet: UserAttribs['metamaskWallet'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isMetamaskVerified: UserAttribs['isMetamaskVerified'];

  @Unique('googleAccount')
  @Length({
    msg: 'LENGTH',
    max: 255 - USER_DELETE_SUFFIX_LENGTH,
  })
  @Column(DataType.STRING(255))
  googleAccount: UserAttribs['googleAccount'];

  @Unique('googleAccountId')
  @Column(DataType.STRING(USER_GOOGLE_ID_LENGTH + USER_DELETE_SUFFIX_LENGTH))
  googleAccountId: UserAttribs['googleAccountId'];

  @Column(DataType.STRING(16))
  twitterHandle: UserAttribs['twitterHandle'];

  @Column(DataType.STRING(64))
  discordAccount: UserAttribs['discordAccount'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isMetamaskWalletPublic!: UserAttribs['isMetamaskWalletPublic'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isTwitterHandlePublic!: UserAttribs['isTwitterHandlePublic'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isDiscordAccountPublic!: UserAttribs['isDiscordAccountPublic'];

  @Column(DataType.DATE)
  lastLoginAt?: UserAttribs['lastLoginAt'];

  @Is('isLocale', isLocale)
  @Column(DataType.STRING(10))
  locale: UserAttribs['locale'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  emailEssential!: UserAttribs['emailEssential'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  emailMarketing!: UserAttribs['emailMarketing'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  cookiesEssential!: UserAttribs['cookiesEssential'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  cookiesAnalytics!: UserAttribs['cookiesAnalytics'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  cookiesFunctional!: UserAttribs['cookiesFunctional'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  cookiesTargeting!: UserAttribs['cookiesTargeting'];

  @Column(DataType.DATE)
  agreeTos: UserAttribs['agreeTos'];

  @Column(DataType.DATE)
  agreePrivacy: UserAttribs['agreePrivacy'];

  @Column(DataType.DATE)
  agreeLegal: UserAttribs['agreeLegal'];

  @AllowNull(false)
  @Unique('referralCode')
  @Column(
    DataType.STRING(USER_REFERRAL_CODE_LENGTH + USER_DELETE_SUFFIX_LENGTH)
  )
  referralCode: UserAttribs['referralCode'];

  @BelongsTo(() => User, { as: 'referredBy', foreignKey: 'referredById' })
  referredBy: UserAttribs['referredBy'];

  @HasMany(() => User, { as: 'referredUsers', foreignKey: 'referredById' })
  referredUsers: UserAttribs['referredUsers'];

  @BelongsToMany(() => Device, () => UserDevice)
  devices: UserAttribs['devices'];

  @BelongsTo(() => UserGroup, 'groupId')
  group: UserAttribs['group'];

  @BelongsTo(() => UserAuth, { as: 'auth', foreignKey: 'authId' })
  auth: UserAttribs['auth'];

  // JS Attributes (NOT synced to DB)
  accessToken?: string;
  refreshToken?: string;
}
