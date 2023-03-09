import {
  Table,
  Column,
  Model,
  DataType,
  IsEmail,
  Unique,
  BelongsTo,
  Default,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import { FindOptions, Optional } from 'sequelize/types';
import { getDeleteSuffix } from '../utils';
import ImageFile, { ImageFileId } from './ImageFile.model';
import UserAuth from './UserAuth.model';

export type UserId = number;
export interface UserAttribs {
  id: UserId;
  userName: string;
  userNameUpdatedAt: Date;
  fullName?: string;
  fullNameUpdatedAt?: Date;
  bio?: string;
  email?: string;
  emailUpdatedAt?: Date;
  isEmailVerified?: boolean;
  profileImageUrl?: string;
  profileImage?: ImageFile;
  profileImageId?: ImageFileId;

  googleAccount?: string;
  googleAccountId?: string;
  googleUpdatedAt?: Date;
  isGooglePublic?: boolean;
  twitterHandle?: string;
  twitterUpdatedAt?: Date;
  isTwitterPublic?: boolean;
  discordAccount?: string;
  discordUpdatedAt?: Date;
  isDiscordPublic?: boolean;
  metamaskWallet?: string;
  metamaskUpdatedAt?: Date;
  isMetamaskPublic?: boolean;

  locale?: string;

  referredBy?: User;
  referredById?: UserId;
  referralCode: string;

  agreeTos?: Date;
  agreeLegal?: Date;
  agreePrivacy?: Date;

  createdAt: Date;
  deletedAt?: Date;

  auth?: UserAuth;
  imageFiles?: ImageFile[];
}

type UserCAttribs = Optional<
  UserAttribs,
  'id' | 'userNameUpdatedAt' | 'createdAt'
>;

type UserResponse = sigmate.Api.User.UserResponse;

export const SIZE_USERNAME = 64;
export const SIZE_FULLNAME = 191;
export const SIZE_EMAIL = 255;
export const SIZE_METAMASK = 64;
export const SIZE_GOOGLE_ID = 32;
export const SIZE_TWITTER = 16;
export const SIZE_DISCORD = 64;
export const SIZE_REFERRAL = 10;

const SIZE_DEL_SUFFIX = getDeleteSuffix().length;

@Table({
  modelName: 'User',
  tableName: 'users',
  timestamps: false,
  underscored: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class User extends Model<UserAttribs, UserCAttribs> {
  @Unique
  @Column(DataType.STRING(SIZE_USERNAME + SIZE_DEL_SUFFIX))
  userName!: UserAttribs['userName'];

  @Column(DataType.DATE)
  userNameUpdatedAt!: UserAttribs['userNameUpdatedAt'];

  @Column(DataType.STRING(SIZE_FULLNAME))
  fullName: UserAttribs['fullName'];

  @Column(DataType.DATE)
  fullNameUpdatedAt: UserAttribs['fullNameUpdatedAt'];

  @Column(DataType.TEXT)
  bio: UserAttribs['bio'];

  @IsEmail
  @Unique
  @Column(DataType.STRING(SIZE_EMAIL + SIZE_DEL_SUFFIX))
  email: UserAttribs['email'];

  @Column(DataType.DATE)
  emailUpdatedAt: UserAttribs['emailUpdatedAt'];

  @Column(DataType.BOOLEAN)
  isEmailVerified: UserAttribs['isEmailVerified'];

  @Column(DataType.STRING(1024))
  profileImageUrl: UserAttribs['profileImageUrl'];

  @BelongsTo(() => ImageFile, { foreignKey: 'profileImageId' })
  profileImage: UserAttribs['profileImage'];

  @Unique
  @Column(DataType.STRING(SIZE_EMAIL + SIZE_DEL_SUFFIX))
  googleAccount: UserAttribs['googleAccount'];

  @Unique
  @Column(DataType.STRING(SIZE_GOOGLE_ID + SIZE_DEL_SUFFIX))
  googleAccountId: UserAttribs['googleAccountId'];

  @Column(DataType.DATE)
  googleUpdatedAt: UserAttribs['googleUpdatedAt'];

  @Column(DataType.BOOLEAN)
  isGooglePublic: UserAttribs['isGooglePublic'];

  @Column(DataType.STRING(SIZE_TWITTER))
  twitterHandle: UserAttribs['twitterHandle'];

  @Column(DataType.DATE)
  twitterUpdatedAt: UserAttribs['twitterUpdatedAt'];

  @Column(DataType.BOOLEAN)
  isTwitterPublic: UserAttribs['isTwitterPublic'];

  @Column(DataType.STRING(SIZE_DISCORD + SIZE_DEL_SUFFIX))
  discordAccount: UserAttribs['discordAccount'];

  @Column(DataType.DATE)
  discordUpdatedAt: UserAttribs['discordUpdatedAt'];

  @Column(DataType.BOOLEAN)
  isDiscordPublic: UserAttribs['isDiscordPublic'];

  @Column(DataType.STRING(SIZE_METAMASK + SIZE_DEL_SUFFIX))
  metamaskWallet: UserAttribs['metamaskWallet'];

  @Column(DataType.DATE)
  metamaskUpdatedAt: UserAttribs['metamaskUpdatedAt'];

  @Column(DataType.BOOLEAN)
  isMetamaskPublic: UserAttribs['isMetamaskPublic'];

  @Column(DataType.STRING(8))
  locale: UserAttribs['locale'];

  @BelongsTo(() => User, { foreignKey: 'referredById' })
  referredBy: UserAttribs['referredBy'];

  @Column(DataType.STRING(SIZE_REFERRAL + SIZE_DEL_SUFFIX))
  referralCode!: UserAttribs['referralCode'];

  @Column(DataType.DATE)
  agreeTos: UserAttribs['agreeTos'];

  @Column(DataType.DATE)
  agreeLegal: UserAttribs['agreeLegal'];

  @Column(DataType.DATE)
  agreePrivacy: UserAttribs['agreePrivacy'];

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: UserAttribs['createdAt'];

  @HasOne(() => UserAuth, 'userId')
  auth: UserAttribs['auth'];

  @HasMany(() => ImageFile, { foreignKey: 'createdById' })
  imageFiles: UserAttribs['imageFiles'];

  static ATTRIB_PUBLIC: Readonly<(keyof UserAttribs)[]> = Object.freeze([
    'id',
    'userName',
    'fullName',
    'profileImageUrl',
    'googleAccount',
    'isGooglePublic',
    'twitterHandle',
    'isTwitterPublic',
    'discordAccount',
    'isDiscordPublic',
    'metamaskWallet',
    'isMetamaskPublic',
  ]);

  static ATTRIB_MY: Readonly<(keyof UserAttribs)[]> = Object.freeze([
    'id',
    'userName',
    'userNameUpdatedAt',
    'fullName',
    'fullNameUpdatedAt',
    'email',
    'emailUpdatedAt',
    'isEmailVerified',
    'profileImageUrl',
    'googleAccount',
    'googleUpdatedAt',
    'isGooglePublic',
    'twitterHandle',
    'twitterUpdatedAt',
    'isTwitterPublic',
    'discordAccount',
    'discordUpdatedAt',
    'isDiscordPublic',
    'metamaskWallet',
    'metamaskUpdatedAt',
    'isMetamaskPublic',
    'locale',
    'referralCode',
    'agreeTos',
    'agreeLegal',
    'agreePrivacy',
    'createdAt',
  ]);

  static FIND_OPTS: Record<string, FindOptions<UserAttribs>> = {
    public: {
      attributes: [...User.ATTRIB_PUBLIC],
      include: [
        {
          model: ImageFile,
          as: 'profileImage',
          attributes: ImageFile.FIND_ATTRIBS.default,
        },
      ],
    },
    publicAll: {
      attributes: [...User.ATTRIB_PUBLIC, 'bio'],
      include: [
        {
          model: ImageFile,
          as: 'profileImage',
          attributes: ImageFile.FIND_ATTRIBS.default,
        },
      ],
    },
    my: {
      attributes: [...User.ATTRIB_MY],
      include: [
        {
          model: ImageFile,
          as: 'profileImage',
          attributes: ImageFile.FIND_ATTRIBS.default,
        },
      ],
    },
    myAll: {
      attributes: [...User.ATTRIB_MY, 'bio'],
      include: [
        {
          model: ImageFile,
          as: 'profileImage',
          attributes: ImageFile.FIND_ATTRIBS.default,
        },
      ],
    },
    auth: {
      attributes: ['id', 'userName'],
      include: [UserAuth],
    },
    exists: {
      attributes: ['id', 'userName'],
    },
  };

  toResponse(): UserResponse {
    return {
      id: this.id,
      userName: this.userName,
      userNameUpdatedAt: this.userNameUpdatedAt,
      fullName: this.fullName,
      fullNameUpdatedAt: this.fullNameUpdatedAt,
      email: this.email,
      emailUpdatedAt: this.emailUpdatedAt,
      isEmailVerified: this.isEmailVerified,
      profileImageUrl: this.profileImageUrl,
      googleAccount: this.googleAccount,
      googleUpdatedAt: this.googleUpdatedAt,
      isGooglePublic: this.isGooglePublic,
      twitterHandle: this.twitterHandle,
      twitterUpdatedAt: this.twitterUpdatedAt,
      isTwitterPublic: this.isTwitterPublic,
      discordAccount: this.discordAccount,
      discordUpdatedAt: this.discordUpdatedAt,
      isDiscordPublic: this.isDiscordPublic,
      metamaskWallet: this.metamaskWallet,
      metamaskUpdatedAt: this.metamaskUpdatedAt,
      isMetamaskPublic: this.isMetamaskPublic,
      locale: this.locale,
      referralCode: this.referralCode,
      agreeTos: this.agreeTos,
      agreeLegal: this.agreeLegal,
      agreePrivacy: this.agreePrivacy,
      createdAt: this.createdAt,
    };
  }
}
