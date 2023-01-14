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
import { Optional } from 'sequelize/types';
import DeviceLocation from './DeviceLocation.model';
import UserDeviceLocation from './UserDeviceLocation.model';
import Restriction from './restriction/Restriction.model';
import UserRestriction from './restriction/UserRestriction.model';

export interface UserAttribs {
  id: number;

  userName: string;
  userNameUpdatedAt?: Date;
  email?: string;
  isEmailVerified?: boolean;

  metamaskWallet?: string | null;
  googleAccount?: string | null;
  googleAccountId?: string | null;
  twitterHandle?: string | null;
  discordAccount?: string | null;

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
  restrictions?: Restriction[];

  devices?: Device[];
  locations?: Location[];
  deviceLocations?: DeviceLocation[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type UserId = UserAttribs['id'];

type UserCAttribs = Optional<UserAttribs, 'id' | 'createdAt' | 'updatedAt'>;

export const SIZE_USERNAME = 15;
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

  @Unique('users.email')
  @Column(DataType.STRING(SIZE_EMAIL + SIZE_DEL_SUFFIX))
  email: UserAttribs['email'];

  @Column(DataType.BOOLEAN)
  isEmailVerified: UserAttribs['isEmailVerified'];

  @Unique('users.metamask_wallet')
  @Column(DataType.STRING(SIZE_METAMASK + SIZE_DEL_SUFFIX))
  metamaskWallet: UserAttribs['metamaskWallet'];

  @Unique('users.google_account')
  @Column(DataType.STRING(SIZE_EMAIL + SIZE_DEL_SUFFIX))
  googleAccount: UserAttribs['googleAccount'];

  @Unique('users.google_acount_id')
  @Column(DataType.STRING(SIZE_GOOGLE_ID + SIZE_DEL_SUFFIX))
  googleAccountId: UserAttribs['googleAccountId'];

  @Column(DataType.STRING(SIZE_TWITTER + SIZE_DEL_SUFFIX))
  twitterHandle: UserAttribs['twitterHandle'];

  @Column(DataType.STRING(SIZE_DISCORD + SIZE_DEL_SUFFIX))
  discordAccount: UserAttribs['discordAccount'];

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

  @BelongsToMany(() => Restriction, {
    through: () => UserRestriction,
    as: 'restrictions',
    foreignKey: 'userId',
    otherKey: 'restrictionId',
  })
  restrictions: UserAttribs['restrictions'];

  @BelongsToMany(() => Device, {
    through: () => UserDevice,
    as: 'devices',
    foreignKey: 'userId',
    otherKey: 'deviceId',
  })
  devices: UserAttribs['devices'];

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
}
