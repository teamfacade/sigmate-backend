import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  HasOne,
  Length,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import Device from './Device.model';
import Location from './Location.model';
import Auth, { AuthAttribs } from './Auth.model';
import Group, { GroupId } from './Group.model';
import Privilege from './privilege/Privilege.model';
import Tier, { TierAttribs } from './Tier.model';
import { getDeleteSuffix } from '../../utils';
import UserDevice from './UserDevice.model';
import UserLocation from './UserLocation.model';
import UserPrivilege from './privilege/UserPrivilege.model';
import { FindOptions, Optional } from 'sequelize/types';
import DeviceLocation from './DeviceLocation.model';
import UserDeviceLocation from './UserDeviceLocation.model';
import UserRestriction from './restriction/UserRestriction.model';
import { MYSQL_LIMITS } from '../../middlewares/validators';

export interface UserAttribs {
  id: number;

  userName: string;
  userNameUpdatedAt?: Date;
  fullName?: string;
  fullNameUpdatedAt?: Date;
  bio?: string;
  email?: string | null;
  isEmailVerified?: boolean;

  metamaskWallet?: string | null;
  metamaskUpdatedAt?: Date;
  googleAccount?: string | null;
  googleAccountId?: string | null;
  googleUpdatedAt?: Date;
  twitterHandle?: string | null;
  twitterUpdatedAt?: Date;
  discordAccount?: string | null;
  discordUpdatedAt?: Date;

  profileImageUrl?: string | null;

  isMetamaskPublic?: boolean | null;
  isTwitterPublic?: boolean | null;
  isDiscordPublic?: boolean | null;

  locale?: string;

  agreeTos?: Date;
  agreePrivacy?: Date;
  agreeLegal?: Date;

  referralCode: string;
  referredBy?: User;
  referredById?: UserId;
  referredUsers?: User[];

  tier?: Tier;
  tierId?: TierAttribs['id'];

  auth?: Auth;
  authId?: AuthAttribs['id'];
  group?: Group;
  groupId?: GroupId;
  privileges?: Privilege[];
  restrictions?: UserRestriction[];

  devices?: Device[];
  userDevices?: UserDevice[];
  locations?: Location[];
  deviceLocations?: DeviceLocation[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type UserId = UserAttribs['id'];

type UserCAttribs = Optional<
  UserAttribs,
  'id' | 'userName' | 'referralCode' | 'createdAt' | 'updatedAt'
>;

export type UserResponse = Pick<
  UserAttribs,
  | 'id'
  | 'userName'
  | 'fullName'
  | 'bio'
  | 'profileImageUrl'
  | 'tier'
  | 'group'
  | 'metamaskWallet'
  | 'twitterHandle'
  | 'discordAccount'
  | 'userNameUpdatedAt'
  | 'email'
  | 'isEmailVerified'
  | 'googleAccount'
  | 'isMetamaskPublic'
  | 'isTwitterPublic'
  | 'isDiscordPublic'
  | 'locale'
  | 'agreeTos'
  | 'agreeLegal'
  | 'agreePrivacy'
  | 'referralCode'
  | 'referredBy'
  | 'createdAt'
>;

export type UserResponsePublic = Pick<
  UserResponse,
  | 'id'
  | 'userName'
  | 'fullName'
  | 'bio'
  | 'profileImageUrl'
  | 'tier'
  | 'group'
  | 'metamaskWallet'
  | 'twitterHandle'
  | 'discordAccount'
>;

export const SIZE_USERNAME = 15;
export const SIZE_FULLNAME = 191;
export const SIZE_EMAIL = 255;
export const SIZE_METAMASK = 64;
export const SIZE_GOOGLE_ID = 32;
export const SIZE_TWITTER = 16;
export const SIZE_DISCORD = 64;
export const SIZE_REFERRAL = 15;

const SIZE_DEL_SUFFIX = getDeleteSuffix().length;

@Table({
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  underscored: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class User extends Model<UserAttribs, UserCAttribs> {
  @Length({
    min: 3,
    max: SIZE_USERNAME + SIZE_DEL_SUFFIX,
  })
  @Unique('users.user_name')
  @Column(DataType.STRING(SIZE_USERNAME + SIZE_DEL_SUFFIX))
  userName!: UserAttribs['userName'];

  @Column(DataType.DATE)
  userNameUpdatedAt: UserAttribs['userNameUpdatedAt'];

  @Length({ min: 3, max: SIZE_FULLNAME })
  @Column(DataType.STRING(191))
  fullName: UserAttribs['fullName'];

  @Column(DataType.DATE)
  fullNameUpdatedAt: UserAttribs['fullNameUpdatedAt'];

  @Length(MYSQL_LIMITS.TEXT)
  @Column(DataType.TEXT)
  bio: UserAttribs['bio'];

  @Unique('users.email')
  @Column(DataType.STRING(SIZE_EMAIL + SIZE_DEL_SUFFIX))
  email: UserAttribs['email'];

  @Column(DataType.BOOLEAN)
  isEmailVerified: UserAttribs['isEmailVerified'];

  @Unique('users.metamask_wallet')
  @Column(DataType.STRING(SIZE_METAMASK + SIZE_DEL_SUFFIX))
  metamaskWallet: UserAttribs['metamaskWallet'];

  @Column(DataType.DATE)
  metamaskUpdatedAt: UserAttribs['metamaskUpdatedAt'];

  @Unique('users.google_account')
  @Column(DataType.STRING(SIZE_EMAIL + SIZE_DEL_SUFFIX))
  googleAccount: UserAttribs['googleAccount'];

  @Unique('users.google_acount_id')
  @Column(DataType.STRING(SIZE_GOOGLE_ID + SIZE_DEL_SUFFIX))
  googleAccountId: UserAttribs['googleAccountId'];

  @Column(DataType.DATE)
  googleUpdatedAt: UserAttribs['googleUpdatedAt'];

  @Column(DataType.STRING(SIZE_TWITTER + SIZE_DEL_SUFFIX))
  twitterHandle: UserAttribs['twitterHandle'];

  @Column(DataType.DATE)
  twitterUpdatedAt: UserAttribs['twitterUpdatedAt'];

  @Column(DataType.STRING(SIZE_DISCORD + SIZE_DEL_SUFFIX))
  discordAccount: UserAttribs['discordAccount'];

  @Column(DataType.DATE)
  discordUpdatedAt: UserAttribs['discordUpdatedAt'];

  @Column(DataType.STRING(1024))
  profileImageUrl: UserAttribs['profileImageUrl'];

  @Column(DataType.BOOLEAN)
  isMetamaskPublic: UserAttribs['isMetamaskPublic'];

  @Column(DataType.BOOLEAN)
  isTwitterPublic: UserAttribs['isTwitterPublic'];

  @Column(DataType.BOOLEAN)
  isDiscordPublic: UserAttribs['isDiscordPublic'];

  @Column(DataType.STRING(8))
  locale: UserAttribs['locale'];

  @Column(DataType.DATE)
  agreeTos: UserAttribs['agreeTos'];

  @Column(DataType.DATE)
  agreeLegal: UserAttribs['agreeLegal'];

  @Column(DataType.DATE)
  agreePrivacy: UserAttribs['agreePrivacy'];

  @AllowNull(false)
  @Unique('users.referral_code')
  @Column(DataType.STRING(SIZE_REFERRAL + SIZE_DEL_SUFFIX))
  referralCode!: UserAttribs['referralCode'];

  @BelongsTo(() => User, { foreignKey: 'referredById', as: 'referredBy' })
  referredBy: UserAttribs['referredBy'];

  @HasMany(() => User, { foreignKey: 'referredById', as: 'referredUsers' })
  referredUsers: UserAttribs['referredUsers'];

  @BelongsTo(() => Tier, { foreignKey: 'tierId' })
  tier: UserAttribs['tier'];

  @HasOne(() => Auth, {
    foreignKey: 'authId',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  auth: UserAttribs['auth'];

  @BelongsTo(() => Group, {
    foreignKey: 'groupId',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  group: UserAttribs['group'];

  @BelongsToMany(() => Privilege, {
    through: () => UserPrivilege,
    as: 'privileges',
    foreignKey: 'userId',
    otherKey: 'privilegeId',
  })
  privileges: UserAttribs['privileges'];

  @HasMany(() => UserRestriction, {
    foreignKey: 'userId',
    as: 'restrictions',
  })
  restrictions: UserAttribs['restrictions'];

  @BelongsToMany(() => Device, {
    through: () => UserDevice,
    as: 'devices',
    foreignKey: 'userId',
    otherKey: 'deviceId',
  })
  devices: UserAttribs['devices'];

  @HasMany(() => UserDevice, {
    foreignKey: 'userId',
    as: 'userDevices',
  })
  userDevices: UserAttribs['userDevices'];

  @BelongsToMany(() => Location, {
    through: () => UserLocation,
    as: 'locations',
    foreignKey: 'userId',
    otherKey: 'locationId',
  })
  locations: UserAttribs['locations'];

  @BelongsToMany(() => DeviceLocation, {
    through: () => UserDeviceLocation,
    as: 'deviceLocations',
    foreignKey: 'userId',
    otherKey: 'deviceLocationId',
  })
  deviceLocations: UserAttribs['deviceLocations'];

  // Always load
  static COMMON_ATTRIBS: (keyof UserAttribs)[] = ['id', 'userName'];

  static FIND_OPTS: Record<string, FindOptions<UserAttribs>> = {
    GOOGLE: {
      attributes: [
        ...User.COMMON_ATTRIBS,
        'fullName',
        'fullNameUpdatedAt',
        'email',
        'googleAccount',
        'googleAccountId',
        'googleUpdatedAt',
        'profileImageUrl',
      ],
      include: [{ model: Auth.scope('google') }],
    },
    TOKEN: {
      attributes: [...User.COMMON_ATTRIBS],
      include: [{ model: Auth.scope('token') }],
    },
    EXISTS: {
      attributes: [...User.COMMON_ATTRIBS],
    },
  };

  /**
   * Pick attributes from the User model that are allowed to be sent to the client.
   * This function does not attempt to fetch attributes that was not already loaded.
   * Load all required attributes first before calling this function.
   * @param options Whether to include sensitive information
   * @returns Formatted User response
   */
  formatResponse(
    options: {
      /** Include sensitive personal information */
      sensitive?: boolean;
    } = {}
  ): UserResponse | UserResponsePublic {
    const user = this.toJSON();

    // Common
    const response: UserResponsePublic = {
      id: user.id,
      userName: user.userName,
      fullName: user.fullName,
      bio: user.bio,
      profileImageUrl: user.profileImageUrl,
      tier: user.tier,
      group: user.group,
    };

    // Respect privacy settings
    const { sensitive } = options;
    if (sensitive || user.isMetamaskPublic) {
      response.metamaskWallet = user.metamaskWallet;
    }
    if (sensitive || user.isTwitterPublic) {
      response.twitterHandle = user.twitterHandle;
    }
    if (sensitive || user.isDiscordPublic) {
      response.discordAccount = user.discordAccount;
    }
    if (!sensitive) {
      // For non-sensitive responses, stop here
      return response;
    }

    // Include private information
    const sensitiveResponse: UserResponse = {
      ...response,
      userNameUpdatedAt: user.userNameUpdatedAt,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      googleAccount: user.googleAccount,
      isMetamaskPublic: user.isMetamaskPublic,
      isTwitterPublic: user.isTwitterPublic,
      isDiscordPublic: user.isDiscordPublic,
      locale: user.locale,
      agreeTos: user.agreeTos,
      agreeLegal: user.agreeLegal,
      agreePrivacy: user.agreePrivacy,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      createdAt: user.createdAt,
    };

    return sensitiveResponse;
  }
}
