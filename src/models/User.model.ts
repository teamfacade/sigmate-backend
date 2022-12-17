import {
  Table,
  Scopes,
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
  HasOne,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import isLocale from 'validator/lib/isLocale';
import { MYSQL_TEXT_MAX_LENGTH } from '../middlewares/validators';
import Device from './Device.model';
import Mission from './Mission.model';
import Penalty from './Penalty.model';
import Privilege from './Privilege.model';
import UserAuth, {
  AUTH_ATTRIBS_GOOGLE,
  AUTH_ATTRIBS_METAMASK,
  AUTH_ATTRIBS_TOKEN,
  UserAuthAttribs,
} from './UserAuth.model';
import UserDevice from './UserDevice.model';
import UserGroup, { UserGroupAttribs } from './UserGroup.model';
import UserMission from './UserMission.model';
import UserPenalty from './UserPenalty.model';
import UserPrivilege from './UserPrivilege.model';

export const USER_USERNAME_MIN_LENGTH = 3;
export const USER_USERNAME_MAX_LENGTH = 15;
export const USER_METAMASK_MAX_LENGTH = 64;
const USER_GOOGLE_ID_LENGTH = 32; // 22 (for future-proof)
const USER_REFERRAL_CODE_LENGTH = 15;
// A dollar sign followed by UNIX epoch timestamp (milliseconds)
// e.g. email@email.com$1668133802617
export const USER_DELETE_SUFFIX_LENGTH = 14;

export interface UserAttribs {
  /** Primary key */
  id: number;

  userName?: string;
  userNameUpdatedAt?: Date;
  email?: string;
  isEmailVerified: boolean;

  tier: number;
  tierUpdatedAt?: Date;

  // Auth
  isAdmin: boolean;
  isTester: boolean;
  isDev: boolean;
  isTeam: boolean;

  // Profile
  fullName?: string;
  bio?: string;
  profileImageUrl?: string | null; // external image
  // profileImage?: Image; // TODO uploaded image

  metamaskWallet?: string;
  isMetamaskVerified?: boolean | null;
  /** Email of Google OAuth account */
  googleAccount?: string | null;
  /** ID for Google OAuth */
  googleAccountId?: string | null;
  twitterHandle?: string;
  discordAccount?: string;

  isMetamaskWalletPublic: boolean | null;
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

  // Associations
  devices?: Device[];
  group?: UserGroup;
  groupId?: UserGroupAttribs['id'];
  auth?: UserAuth;
  authId?: UserAuthAttribs['id'];
  privileges?: Privilege[];
  missions?: Mission[];
  penalties?: Penalty[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type UserCAttribs = Optional<
  UserAttribs,
  | 'id'
  | 'isEmailVerified'
  | 'tier'
  | 'isAdmin'
  | 'isTester'
  | 'isDev'
  | 'isTeam'
  | 'isMetamaskWalletPublic'
  | 'isTwitterHandlePublic'
  | 'isDiscordAccountPublic'
  | 'emailEssential'
  | 'emailMarketing'
  | 'cookiesEssential'
  | 'cookiesAnalytics'
  | 'cookiesFunctional'
  | 'cookiesTargeting'
  | 'createdAt'
  | 'updatedAt'
>;

export type UserId = UserAttribs['id'];

// Scopes
export const USER_ATTRIBS_DEFAULT: (keyof UserAttribs)[] = [
  'id',
  'isAdmin',
  'isTeam',
  'isTester',
  'isDev',
  'groupId',
];

export const USER_ATTRIBS_PUBLIC: (keyof UserAttribs)[] = [
  ...USER_ATTRIBS_DEFAULT,
  'userName',
  'tier',
  'fullName',
  'profileImageUrl',
  'metamaskWallet',
  'isMetamaskVerified',
  'isMetamaskWalletPublic',
  'twitterHandle',
  'isTwitterHandlePublic',
  'discordAccount',
  'isDiscordAccountPublic',
];

export const USER_ATTRIBS_MY_LOGIN: (keyof UserAttribs)[] = [
  ...USER_ATTRIBS_PUBLIC,
  'userNameUpdatedAt',
  'email',
  'isEmailVerified',
  'googleAccount',
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
];

export type UserScopeName =
  | 'exists'
  | 'tokenAuth'
  | 'googleAuth'
  | 'metamaskAuth'
  | 'public'
  | 'publicFull'
  | 'beforeUpdate'
  | 'my'
  | 'myFull';

// ALWAYS include the id attribute!
@Scopes(() => ({
  exists: {
    attributes: ['id'],
  },
  tokenAuth: {
    attributes: USER_ATTRIBS_DEFAULT,
    include: [{ model: UserAuth, attributes: AUTH_ATTRIBS_TOKEN }],
  },
  /**
   * Google connect, authentication
   */
  googleAuth: {
    attributes: [...USER_ATTRIBS_DEFAULT, 'googleAccount', 'googleAccountId'],
    include: [{ model: UserAuth, attributes: AUTH_ATTRIBS_GOOGLE }],
  },
  /**
   * Metamask connect, authentication
   */
  metamaskAuth: {
    attributes: [
      ...USER_ATTRIBS_DEFAULT,
      'metamaskWallet',
      'isMetamaskVerified',
    ],
    include: [{ model: UserAuth, attributes: AUTH_ATTRIBS_METAMASK }],
  },
  /**
   * Information about someone else
   */
  public: {
    attributes: USER_ATTRIBS_PUBLIC,
    include: {
      model: UserGroup,
      attributes: ['id', 'name'],
    },
  },
  /**
   * Full information about someone else (including "slow" fields)
   */
  publicFull: {
    attributes: [...USER_ATTRIBS_PUBLIC, 'bio'],
  },
  /**
   * Used for reload calls before updating user information,
   * to perform policy checks
   */
  beforeUpdate: {
    attributes: ['id', 'userNameUpdatedAt', 'referralCode', 'referredById'],
    include: {
      model: User,
      attributes: ['id'],
      as: 'referredBy',
    },
  },
  /**
   * Most of the information about myself (Usage: After successful
   * login/signup, user account page, etc.)
   */
  my: {
    attributes: USER_ATTRIBS_MY_LOGIN,
    include: [
      {
        model: UserAuth,
        attributes: AUTH_ATTRIBS_TOKEN,
      },
      {
        model: UserGroup,
        attributes: ['id', 'name'],
      },
    ],
  },
  /**
   * Full information about myself (including "slow" fields)
   */
  myFull: {
    attributes: [...USER_ATTRIBS_MY_LOGIN, 'bio'],
    include: [
      {
        model: UserAuth,
        attributes: AUTH_ATTRIBS_TOKEN,
      },
    ],
  },
}))
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

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  tier!: UserAttribs['tier'];

  @Column(DataType.DATE)
  tierUpdatedAt: UserAttribs['tierUpdatedAt'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isAdmin!: UserAttribs['isAdmin'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isTester!: UserAttribs['isTester'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isTeam!: UserAttribs['isTeam'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isDev!: UserAttribs['isDev'];

  @Column(DataType.STRING)
  fullName: UserAttribs['fullName'];

  @Length({ msg: 'LENGTH', max: MYSQL_TEXT_MAX_LENGTH })
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
  @Length({
    msg: 'LENGTH',
    max: USER_GOOGLE_ID_LENGTH + USER_DELETE_SUFFIX_LENGTH,
  })
  @Column(DataType.STRING(USER_GOOGLE_ID_LENGTH + USER_DELETE_SUFFIX_LENGTH))
  googleAccountId: UserAttribs['googleAccountId'];

  @Length({ msg: 'LENGTH', max: 16 })
  @Column(DataType.STRING(16))
  twitterHandle: UserAttribs['twitterHandle'];

  @Length({ msg: 'LENGTH', max: 64 })
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
  @Length({ msg: 'LENGTH', max: 10 })
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

  @HasOne(() => UserAuth, {
    as: 'auth',
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  })
  auth: UserAttribs['auth'];

  @BelongsToMany(() => Mission, {
    through: () => UserMission,
    foreignKey: 'userId',
    otherKey: 'missionId',
    as: 'missions',
  })
  missions: UserAttribs['missions'];

  @BelongsToMany(() => Penalty, {
    through: () => UserPenalty,
    foreignKey: 'userId',
    otherKey: 'penaltyId',
    as: 'penalties',
  })
  penalties: UserAttribs['penalties'];

  @BelongsToMany(() => Privilege, {
    through: () => UserPrivilege,
    foreignKey: 'userId',
    otherKey: 'privilegeId',
    as: 'privileges',
  })
  privileges: UserAttribs['privileges'];

  UserPrivilege?: UserPrivilege;
}
