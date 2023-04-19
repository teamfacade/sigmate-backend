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
  Length,
} from 'sequelize-typescript';
import { FindOptions, Optional } from 'sequelize/types';
import { getDeleteSuffix } from '../utils';
import { ImageFileId, ImageFile } from './ImageFile.model';
import { UserAuth } from './UserAuth.model';

export type UserId = string;
export interface UserAttribs {
  id: UserId;
  userName: string;
  userNameUpdatedAt: Date;
  fullName?: string;
  fullNameUpdatedAt?: Date;
  bio?: string;
  email?: string | null;
  emailUpdatedAt?: Date;
  isEmailVerified?: boolean;
  profileImageUrl?: string;
  profileImage?: ImageFile;
  profileImageId?: ImageFileId;

  googleAccount?: string | null;
  googleAccountId?: string | null;
  googleUpdatedAt?: Date | null;
  isGooglePublic?: boolean | null;
  twitterHandle?: string;
  twitterUpdatedAt?: Date;
  isTwitterPublic?: boolean;
  discordAccount?: string;
  discordAccountId?: string;
  discordUpdatedAt?: Date;
  isDiscordPublic?: boolean;
  metamaskWallet?: string | null;
  metamaskUpdatedAt?: Date | null;
  isMetamaskVerified?: boolean | null;
  isMetamaskPublic?: boolean | null;

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

export type UserCAttribs = Optional<
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
export class User extends Model<UserAttribs, UserCAttribs> {
  @Unique('user.user_name')
  @Column(DataType.STRING(SIZE_USERNAME + SIZE_DEL_SUFFIX))
  userName!: UserAttribs['userName'];

  @Column(DataType.DATE)
  userNameUpdatedAt!: UserAttribs['userNameUpdatedAt'];

  @Length({ max: SIZE_FULLNAME })
  @Column(DataType.STRING(SIZE_FULLNAME))
  fullName: UserAttribs['fullName'];

  @Column(DataType.DATE)
  fullNameUpdatedAt: UserAttribs['fullNameUpdatedAt'];

  @Column(DataType.TEXT)
  bio: UserAttribs['bio'];

  @IsEmail
  @Unique('user.email')
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

  @Unique('user.google_acount')
  @Column(DataType.STRING(SIZE_EMAIL + SIZE_DEL_SUFFIX))
  googleAccount: UserAttribs['googleAccount'];

  @Unique('user.google_account_id')
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

  //@Unique('user.discord_acount') - 기존에 안 걸려있는데 특별한 이유가 있을까요?
  @Column(DataType.STRING(SIZE_DISCORD + SIZE_DEL_SUFFIX))
  discordAccount: UserAttribs['discordAccount'];

  //@Unique('user.discord_acount_id')
  @Column(DataType.STRING(SIZE_DISCORD + SIZE_DEL_SUFFIX))
  discordAccountId: UserAttribs['discordAccount'];

  @Column(DataType.DATE)
  discordUpdatedAt: UserAttribs['discordUpdatedAt'];

  @Column(DataType.BOOLEAN)
  isDiscordPublic: UserAttribs['isDiscordPublic'];

  @Unique('user.metamask_wallet')
  @Column(DataType.STRING(SIZE_METAMASK + SIZE_DEL_SUFFIX))
  metamaskWallet: UserAttribs['metamaskWallet'];

  @Column(DataType.DATE)
  metamaskUpdatedAt: UserAttribs['metamaskUpdatedAt'];

  @Column(DataType.BOOLEAN)
  isMetamaskPublic: UserAttribs['isMetamaskPublic'];

  @Column(DataType.BOOLEAN)
  isMetamaskVerified: UserAttribs['isMetamaskVerified'];

  @Column(DataType.STRING(8))
  locale: UserAttribs['locale'];

  @BelongsTo(() => User, { foreignKey: 'referredById', as: 'referredBy' })
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
    'isMetamaskVerified',
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
    'googleAccountId',
    'googleUpdatedAt',
    'isGooglePublic',
    'twitterHandle',
    'twitterUpdatedAt',
    'isTwitterPublic',
    'discordAccount',
    'discordAccountId',
    'discordUpdatedAt',
    'isDiscordPublic',
    'metamaskWallet',
    'metamaskUpdatedAt',
    'isMetamaskPublic',
    'isMetamaskVerified',
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
        {
          model: User,
          as: 'referredBy',
          attributes: [...User.ATTRIB_PUBLIC],
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
        {
          model: User,
          as: 'referredBy',
          attributes: [...User.ATTRIB_PUBLIC],
        },
      ],
    },
    auth: {
      attributes: [
        'id',
        'userName',
        'googleAccount',
        'googleAccountId',
        'googleUpdatedAt',
        'isGooglePublic',
        'discordAccount',
        'discordAccountId',
        'discordUpdatedAt',
        'metamaskWallet',
        'metamaskUpdatedAt',
        'isMetamaskPublic',
      ],
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
      isMetamaskVerified: this.isMetamaskVerified,
      locale: this.locale,
      referralCode: this.referralCode,
      referredBy: this.referredBy?.toResponse(),
      agreeTos: this.agreeTos,
      agreeLegal: this.agreeLegal,
      agreePrivacy: this.agreePrivacy,
      createdAt: this.createdAt,
    };
  }
}
