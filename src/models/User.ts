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
import UserProfile from './UserProfile';
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

export type UserIdType = number;
export const userIdDataType = DataType.INTEGER;
export const USERNAME_MAX_LENGTH = 16;

export interface UserAttributes {
  id: UserIdType;
  userName?: string;
  userNameUpdatedAt: Date;
  email: string;
  emailVerified: boolean;
  group: UserGroup;
  primaryProfile: UserProfile;
  isTester: boolean;
  isAdmin: boolean;
  metamaskWallet?: string;
  googleAccount?: string;
  googleAccountId?: string;
  twitterHandle?: string;
  discordAccount?: string;
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
  referralCode: string;
  referredBy?: User;
  referredUsers?: User[];
  userAuth?: UserAuth;
  adminUser?: AdminUser;

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

export type UserDTO = Require<Partial<UserAttributes>, 'id'>;
export type UserCreationDTO = Require<Omit<UserDTO, 'id'>, 'email'>;

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
  @AllowNull(false)
  @Column(DataType.STRING(191))
  email!: UserAttributes['email'];

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

  @Column(DataType.STRING(64))
  metamaskWallet: UserAttributes['metamaskWallet'];

  @Column(DataType.STRING(191))
  googleAccount: UserAttributes['googleAccount'];

  @Column(DataType.STRING(22 + 15))
  googleAccountId: UserAttributes['googleAccountId'];

  @Column(DataType.STRING(16))
  twitterHandle: UserAttributes['twitterHandle'];

  @Column(DataType.STRING(64))
  discordAccount: UserAttributes['discordAccount'];

  @Default(DataType.NOW)
  @AllowNull(false)
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

  @HasMany(() => User, 'referredById')
  referredUsers: UserAttributes['referredUsers'];

  @BelongsTo(() => User, 'referredById')
  referredBy: UserAttributes['referredBy'];

  @HasOne(() => UserAuth, 'userId')
  userAuth!: UserAttributes['userAuth'];

  @HasOne(() => AdminUser, { as: 'adminUser', foreignKey: 'userId' })
  adminUser: UserAttributes['adminUser'];

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
