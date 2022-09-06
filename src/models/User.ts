import { Optional } from 'sequelize/types';
import Require from '../types/Require';
import {
  Model,
  DataType,
  Table,
  Column,
  BelongsTo,
  AllowNull,
  Unique,
  Default,
  HasOne,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import UserGroup from './UserGroup';
import UserProfile, { UserProfileAttributes } from './UserProfile';
import UserAuth from './UserAuth';
import AdminUser from './AdminUser';
import Block from './Block';
import BlockAudit from './BlockAudit';
import BlockVerification from './BlockVerification';
import Category from './Category';
import Collection from './Collection';
import CollectionDocumentTable from './CollectionDocumentTable';
import CollectionType from './CollectionType';
import CollectionUtility from './CollectionUtility';
import Document from './Document';
import DocumentAudit from './DocumentAudit';
import ForumComment from './ForumComment';
import ForumCommentVote from './ForumCommentVote';
import ForumPost from './ForumPost';
import ForumPostView from './ForumPostView';
import ForumPostVote from './ForumPostVote';
import ForumReport from './ForumReport';
import ForumTag from './ForumTag';
import Image from './Image';
import MintingSchedule from './MintingSchedule';
import Nft from './Nft';
import Opinion from './Opinion';
import OpinionVerification from './OpinionVerification';
import Url from './Url';
import UrlVerification from './UrlVerification';
import UserAttendance from './UserAttendance';
import UserSavedMintingSchedule from './UserSavedMintingSchedule';
import UserDevice from './UserDevice';
import UserOwnedDevice from './UserOwnedDevice';

export type UserIdType = number;
export const userIdDataType = DataType.INTEGER;
export const USERNAME_MAX_LENGTH = 16;

export interface UserAttributes {
  id: UserIdType;
  userName?: string;
  userNameUpdatedAt: Date;
  email?: string;
  emailVerified: boolean;
  group: UserGroup;
  primaryProfile: UserProfile;
  isTester: boolean;
  isAdmin: boolean;
  metamaskWallet?: string;
  isMetamaskWalletPublic: boolean;
  googleAccount?: string;
  googleAccountId?: string;
  twitterHandle?: string;
  isTwitterHandlePublic: boolean;
  discordAccount?: string;
  isDiscordAccountPublic: boolean;
  lastLoginAt?: Date;
  locale?: string;
  theme?: string;
  emailEssential: boolean;
  emailMarketing: boolean;
  cookiesEssential: boolean;
  cookiesAnalytics: boolean;
  cookiesFunctional: boolean;
  cookiesTargeting: boolean;
  agreeTos?: Date;
  agreePrivacy?: Date;
  agreeLegal?: Date;
  referralCode: string; // my referral code
  referredBy?: User; // someone else's referral code
  referredUsers?: User[];
  userAuth?: UserAuth;
  adminUser?: AdminUser;
  devices?: UserDevice[];

  appointedAdminUsers?: AdminUser[];
  createdBlocks?: Block[];
  updatedBlocks?: Block[];
  deletedBlocks?: Block[];
  createdBlockAudits?: BlockAudit[];
  approvedBlockAudits?: BlockAudit[];
  revertedBlockAudits?: BlockAudit[];
  createdBlockVerifications?: BlockVerification[];
  deletedBlockVerifications?: BlockVerification[];
  createdCategories?: Category[];
  createdCollections?: Collection[];
  updatedCollections?: Collection[];
  createdCollectionDocumentTables?: CollectionDocumentTable[];
  updatedCollectionDocumentTables?: CollectionDocumentTable[];
  createdCollectionTypes?: CollectionType[];
  updatedCollectionTypes?: CollectionType[];
  createdCollectionUtilities?: CollectionUtility[];
  updatedCollectionUtilities?: CollectionUtility[];
  createdDocuments?: Document[];
  updatedDocuments?: Document[];
  deletedDocuments?: Document[];
  createdDocumentAudits?: DocumentAudit[];
  approvedDocumentAudits?: DocumentAudit[];
  revertedDocumentAudits?: DocumentAudit[];
  createdForumComments?: ForumComment[];
  deletedForumComments?: ForumComment[];
  createdForumCommentVotes?: ForumCommentVote[];
  deletedForumCommentVotes?: ForumCommentVote[];
  createdForumPosts?: ForumPost[];
  updatedForumPosts?: ForumPost[];
  deletedForumPosts?: ForumPost[];
  forumPostViews?: ForumPostView[];
  createdForumPostVotes?: ForumPostVote[];
  deletedForumPostVotes?: ForumPostVote[];
  createdForumReports?: ForumReport[];
  feedbackForumReports?: ForumReport[];
  deletedForumReports?: ForumReport[];
  createdForumTags?: ForumTag[];
  createdImages?: Image[];
  createdMintingSchedules?: MintingSchedule[];
  updatedMintingSchedules?: MintingSchedule[];
  savedMintingSchedules?: MintingSchedule[];
  createdNfts?: Nft[];
  createdOpinions?: Opinion[];
  createdOpinionVerifications?: OpinionVerification[];
  deletedOpinionVerifications?: OpinionVerification[];
  createdUrls?: Url[];
  createdUrlVerifications?: UrlVerification[];
  deletedUrlVerifications?: UrlVerification[];
  userAttendanceRecords?: UserAttendance[];
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  | 'id'
  | 'userNameUpdatedAt'
  | 'emailVerified'
  | 'isMetamaskWalletPublic'
  | 'isTwitterHandlePublic'
  | 'isDiscordAccountPublic'
  | 'group'
  | 'primaryProfile'
  | 'isTester'
  | 'isAdmin'
  | 'emailEssential'
  | 'emailMarketing'
  | 'cookiesEssential'
  | 'cookiesAnalytics'
  | 'cookiesFunctional'
  | 'cookiesTargeting'
>;
export interface UserDTO extends Require<Partial<UserAttributes>, 'id'> {
  referredByCode?: UserAttributes['referralCode'];
}
export type UserCreationDTO = Omit<UserDTO, 'id'>;

export interface UserResponse
  extends Pick<
    UserAttributes,
    | 'id'
    | 'userName'
    | 'userNameUpdatedAt'
    | 'email'
    | 'metamaskWallet'
    | 'isMetamaskWalletPublic'
    | 'googleAccount'
    | 'twitterHandle'
    | 'isTwitterHandlePublic'
    | 'discordAccount'
    | 'isDiscordAccountPublic'
    | 'isTester'
    | 'isAdmin'
    | 'locale'
    | 'theme'
    | 'emailEssential'
    | 'emailMarketing'
    | 'cookiesEssential'
    | 'cookiesAnalytics'
    | 'cookiesFunctional'
    | 'cookiesTargeting'
    | 'agreeTos'
    | 'agreePrivacy'
    | 'agreeLegal'
    | 'referralCode'
    | 'group'
    | 'primaryProfile'
    | 'adminUser'
  > {
  referredBy: UserAttributes['referralCode'] | null;
}

// User information if requested by another user (only public information)
export interface UserPublicResponse
  extends Pick<
    UserResponse,
    'id' | 'userName' | 'metamaskWallet' | 'twitterHandle' | 'discordAccount'
  > {
  primaryProfile: Omit<UserProfileAttributes, 'user'>;
}

export const availableThemes = ['light', 'dark', 'auto'];

@Table({
  tableName: 'users',
  modelName: 'User',
  underscored: true,
  paranoid: true,
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class User extends Model<
  UserAttributes,
  UserCreationAttributes
> {
  @Unique('userName')
  @Column(DataType.STRING(16 + 15))
  userName!: UserAttributes['userName'];

  @Column(DataType.DATE)
  userNameUpdatedAt!: UserAttributes['userNameUpdatedAt'];

  @Unique('email')
  @Column(DataType.STRING(191))
  email: UserAttributes['email'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  emailVerified!: UserAttributes['emailVerified'];

  @BelongsTo(() => UserGroup, 'groupId')
  group!: UserAttributes['group'];

  @HasOne(() => UserProfile, 'userId')
  primaryProfile!: UserAttributes['primaryProfile'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isTester!: UserAttributes['isTester'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isAdmin!: UserAttributes['isAdmin'];

  @Unique('metamaskWallet')
  @Column(DataType.STRING(64))
  metamaskWallet: UserAttributes['metamaskWallet'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isMetamaskWalletPublic!: UserAttributes['isMetamaskWalletPublic'];

  @Column(DataType.STRING(191))
  googleAccount: UserAttributes['googleAccount'];

  @Column(DataType.STRING(22 + 15))
  googleAccountId: UserAttributes['googleAccountId'];

  @Column(DataType.STRING(16))
  twitterHandle: UserAttributes['twitterHandle'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isTwitterHandlePublic!: UserAttributes['isTwitterHandlePublic'];

  @Column(DataType.STRING(64))
  discordAccount: UserAttributes['discordAccount'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isDiscordAccountPublic!: UserAttributes['isDiscordAccountPublic'];

  @Column(DataType.DATE)
  lastLoginAt!: UserAttributes['lastLoginAt'];

  @Column(DataType.STRING(5))
  locale: UserAttributes['locale'];

  @Column(DataType.STRING(5))
  theme: UserAttributes['theme'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  emailEssential!: UserAttributes['emailEssential'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  emailMarketing!: UserAttributes['emailMarketing'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  cookiesEssential!: UserAttributes['cookiesEssential'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  cookiesAnalytics!: UserAttributes['cookiesAnalytics'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  cookiesFunctional!: UserAttributes['cookiesFunctional'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  cookiesTargeting!: UserAttributes['cookiesTargeting'];

  @Column(DataType.DATE)
  agreeTos: UserAttributes['agreeTos'];

  @Column(DataType.DATE)
  agreePrivacy: UserAttributes['agreePrivacy'];

  @Column(DataType.DATE)
  agreeLegal: UserAttributes['agreeLegal'];

  @AllowNull(false)
  @Column(DataType.STRING(16))
  referralCode!: UserAttributes['referralCode'];

  @HasMany(() => User, { as: 'referredUsers', foreignKey: 'referredById' })
  referredUsers: UserAttributes['referredUsers'];

  @BelongsTo(() => User, { as: 'referredBy', foreignKey: 'referredById' })
  referredBy: UserAttributes['referredBy'];

  @HasOne(() => UserAuth, 'userId')
  userAuth!: UserAttributes['userAuth'];

  @HasOne(() => AdminUser, { as: 'adminUser', foreignKey: 'userId' })
  adminUser: UserAttributes['adminUser'];

  @BelongsToMany(() => UserDevice, () => UserOwnedDevice)
  devices: UserAttributes['devices'];

  @HasMany(() => AdminUser, {
    as: 'appointedAdminUsers',
    foreignKey: 'appointedById',
  })
  appointedAdminUsers: UserAttributes['appointedAdminUsers'];

  @HasMany(() => Block, 'createdById')
  createdBlocks: UserAttributes['createdBlocks'];

  @HasMany(() => Block, 'updatedById')
  updatedBlocks: UserAttributes['updatedBlocks'];

  @HasMany(() => Block, 'deletedById')
  deletedBlocks: UserAttributes['deletedBlocks'];

  @HasMany(() => BlockAudit, 'createdById')
  createdBlockAudits: UserAttributes['createdBlockAudits'];

  @HasMany(() => BlockAudit, 'approvedById')
  approvedBlockAudits: UserAttributes['approvedBlockAudits'];

  @HasMany(() => BlockAudit, 'revertedById')
  revertedBlockAudits: UserAttributes['revertedBlockAudits'];

  @HasMany(() => BlockVerification, 'createdById')
  createdBlockVerifications: UserAttributes['createdBlockVerifications'];

  @HasMany(() => BlockVerification, 'deletedById')
  deletedBlockVerifications: UserAttributes['deletedBlockVerifications'];

  @HasMany(() => Category, 'createdById')
  createdCategories: UserAttributes['createdCategories'];

  @HasMany(() => Collection, 'createdById')
  createdCollections: UserAttributes['createdCollections'];

  @HasMany(() => Collection, 'updatedById')
  updatedCollections: UserAttributes['updatedCollections'];

  @HasMany(() => CollectionDocumentTable, 'createdByDeviceId')
  createdCollectionDocumentTables: UserAttributes['createdCollectionDocumentTables'];

  @HasMany(() => CollectionDocumentTable, 'updatedByDeviceId')
  updatedCollectionDocumentTable: UserAttributes['updatedCollectionDocumentTables'];

  @HasMany(() => CollectionType, 'createdById')
  createdCollectionTypes: UserAttributes['createdCollectionTypes'];

  @HasMany(() => CollectionType, 'updatedById')
  updatedCollectionTypes: UserAttributes['updatedCollectionTypes'];

  @HasMany(() => CollectionUtility, 'createdById')
  createdCollectionUtilities: UserAttributes['createdCollectionUtilities'];

  @HasMany(() => CollectionUtility, 'updatedById')
  updatedCollectionUtilities: UserAttributes['updatedCollectionUtilities'];

  @HasMany(() => Document, 'createdById')
  createdDocuments: UserAttributes['createdDocuments'];

  @HasMany(() => Document, 'updatedById')
  updatedDocuments: UserAttributes['updatedDocuments'];

  @HasMany(() => Document, 'deletedById')
  deletedDocuments: UserAttributes['deletedDocuments'];

  @HasMany(() => DocumentAudit, 'createdById')
  createdDocumentAudits: UserAttributes['createdDocumentAudits'];

  @HasMany(() => DocumentAudit, 'approvedById')
  approvedDocumentAudits: UserAttributes['approvedDocumentAudits'];

  @HasMany(() => DocumentAudit, 'revertedById')
  revertedDocumentAudits: UserAttributes['revertedDocumentAudits'];

  @HasMany(() => ForumComment, 'createdById')
  createdForumComments: UserAttributes['createdForumComments'];

  @HasMany(() => ForumComment, 'deletedById')
  deletedForumComments: UserAttributes['deletedForumComments'];

  @HasMany(() => ForumCommentVote, 'createdById')
  createdForumCommentVotes: UserAttributes['createdForumCommentVotes'];

  @HasMany(() => ForumCommentVote, 'deletedByid')
  deletedForumCommentVotes: UserAttributes['deletedForumCommentVotes'];

  @HasMany(() => ForumPost, 'createdById')
  createdForumPosts: UserAttributes['createdForumPosts'];

  @HasMany(() => ForumPost, 'updatedById')
  updatedForumPosts: UserAttributes['updatedForumPosts'];

  @HasMany(() => ForumPost, 'deletedById')
  deletedForumPosts: UserAttributes['deletedForumPosts'];

  @HasMany(() => ForumPostView, 'viewedById')
  forumPostViews: UserAttributes['forumPostViews'];

  @HasMany(() => ForumPostVote, 'createdById')
  createdForumPostVotes: UserAttributes['createdForumPostVotes'];

  @HasMany(() => ForumPostVote, 'deletedById')
  deletedForumPostVotes: UserAttributes['deletedForumPostVotes'];

  @HasMany(() => ForumReport, 'createdById')
  createdForumReports: UserAttributes['createdForumReports'];

  @HasMany(() => ForumReport, 'feedbackById')
  feedbackForumReports: UserAttributes['feedbackForumReports'];

  @HasMany(() => ForumReport, 'deletedById')
  deletedForumReports: UserAttributes['deletedForumReports'];

  @HasMany(() => ForumTag, 'createdById')
  createdForumTags: UserAttributes['createdForumTags'];

  @HasMany(() => Image, 'createdById')
  createdImages: UserAttributes['createdImages'];

  @HasMany(() => MintingSchedule, 'createdById')
  createdMintingSchedules: UserAttributes['createdMintingSchedules'];

  @HasMany(() => MintingSchedule, 'updatedById')
  updatedMintingSchedules: UserAttributes['updatedMintingSchedules'];

  @BelongsToMany(() => MintingSchedule, () => UserSavedMintingSchedule)
  savedMintingSchedules: UserAttributes['savedMintingSchedules'];

  @HasMany(() => Nft, 'createdById')
  createdNfts: UserAttributes['createdNfts'];

  @HasMany(() => Opinion, 'createdById')
  createdOpinions: UserAttributes['createdOpinions'];

  @HasMany(() => OpinionVerification, 'createdById')
  createdOpinionVerifications: UserAttributes['createdOpinionVerifications'];

  @HasMany(() => OpinionVerification, 'deletedById')
  deletedOpinionVerifications: UserAttributes['deletedOpinionVerifications'];

  @HasMany(() => Url, 'createdById')
  createdUrls: UserAttributes['createdUrls'];

  @HasMany(() => UrlVerification, 'createdById')
  createdUrlVerifications: UserAttributes['createdUrlVerifications'];

  @HasMany(() => UrlVerification, 'deletedById')
  deletedUrlVerifications: UserAttributes['deletedUrlVerifications'];

  @HasMany(() => UserAttendance, 'createdById')
  userAttendanceRecords: UserAttributes['userAttendanceRecords'];
}
