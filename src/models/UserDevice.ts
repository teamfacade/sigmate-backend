import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { intToIp, ipToInt } from '../utils/ipAddress';
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
import UserAgent from './UserAgent';
import UserAttendance from './UserAttendance';

export type UserDeviceIdType = number;

export interface UserDeviceAttributes {
  id: UserDeviceIdType;
  ipv4: number;
  userAgent: UserAgent;
  isFlagged: boolean;
  isBanned: boolean;
  remarks?: string;

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
  createdNfts?: Nft[];
  createdOpinions?: Opinion[];
  createdOpinionVerifications?: OpinionVerification[];
  deletedOpinionVerifications?: OpinionVerification[];
  createdUrls?: Url[];
  createdUrlVerifications?: UrlVerification[];
  deletedUrlVerifications?: UrlVerification[];
  userAttendanceRecords?: UserAttendance[];
}

export type UserDeviceCreationAttributes = Optional<
  UserDeviceAttributes,
  'id' | 'isFlagged' | 'isBanned'
>;

@Table({
  tableName: 'user_devices',
  modelName: 'UserDevice',
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserDevice extends Model<
  UserDeviceAttributes,
  UserDeviceCreationAttributes
> {
  @Unique('device')
  @AllowNull(false)
  @Column(DataType.INTEGER)
  get ipv4(): string {
    return intToIp(this.getDataValue('ipv4'));
  }
  set ipv4(value: string) {
    this.setDataValue('ipv4', ipToInt(value));
  }

  @BelongsTo(() => UserAgent, 'userAgentId')
  userAgent!: UserDeviceAttributes['userAgent'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isFlagged!: UserDeviceAttributes['isFlagged'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isBanned!: UserDeviceAttributes['isBanned'];

  @Column(DataType.STRING)
  remarks!: UserDeviceAttributes['remarks'];

  @HasMany(() => AdminUser)
  appointedAdminUsers: UserDeviceAttributes['appointedAdminUsers'];

  @HasMany(() => Block, 'createdByDeviceId')
  createdBlocks: UserDeviceAttributes['createdBlocks'];

  @HasMany(() => Block, 'updatedByDeviceId')
  updatedBlocks: UserDeviceAttributes['updatedBlocks'];

  @HasMany(() => Block, 'deletedByDeviceId')
  deletedBlocks: UserDeviceAttributes['deletedBlocks'];

  @HasMany(() => BlockAudit, 'createdByDeviceId')
  createdBlockAudits: UserDeviceAttributes['createdBlockAudits'];

  @HasMany(() => BlockAudit, 'approvedByDeviceId')
  approvedBlockAudits: UserDeviceAttributes['approvedBlockAudits'];

  @HasMany(() => BlockAudit, 'revertedByDeviceId')
  revertedBlockAudits: UserDeviceAttributes['revertedBlockAudits'];

  @HasMany(() => BlockVerification, 'createdByDeviceId')
  createdBlockVerifications: UserDeviceAttributes['createdBlockVerifications'];

  @HasMany(() => BlockVerification, 'deletedByDeviceId')
  deletedBlockVerifications: UserDeviceAttributes['deletedBlockVerifications'];

  @HasMany(() => Category)
  createdCategories: UserDeviceAttributes['createdCategories'];

  @HasMany(() => Collection, 'createdByDeviceId')
  createdCollections: UserDeviceAttributes['createdCollections'];

  @HasMany(() => Collection, 'updatedByDeviceId')
  updatedCollections: UserDeviceAttributes['updatedCollections'];

  @HasMany(() => CollectionDocumentTable, 'createdByDeviceId')
  createdCollectionDocumentTables: UserDeviceAttributes['createdCollectionDocumentTables'];

  @HasMany(() => CollectionDocumentTable, 'updatedByDeviceId')
  updatedCollectionDocumentTable: UserDeviceAttributes['updatedCollectionDocumentTables'];

  @HasMany(() => CollectionType, 'createdByDeviceId')
  createdCollectionTypes: UserDeviceAttributes['createdCollectionTypes'];

  @HasMany(() => CollectionType, 'updatedByDeviceId')
  updatedCollectionTypes: UserDeviceAttributes['updatedCollectionTypes'];

  @HasMany(() => CollectionUtility, 'createdByDeviceId')
  createdCollectionUtilities: UserDeviceAttributes['createdCollectionUtilities'];

  @HasMany(() => CollectionUtility, 'updatedByDeviceId')
  updatedCollectionUtilities: UserDeviceAttributes['updatedCollectionUtilities'];

  @HasMany(() => Document, 'createdByDeviceId')
  createdDocuments: UserDeviceAttributes['createdDocuments'];

  @HasMany(() => Document, 'updatedByDeviceId')
  updatedDocuments: UserDeviceAttributes['updatedDocuments'];

  @HasMany(() => Document, 'deletedByDeviceId')
  deletedDocuments: UserDeviceAttributes['deletedDocuments'];

  @HasMany(() => DocumentAudit, 'createdByDeviceId')
  createdDocumentAudits: UserDeviceAttributes['createdDocumentAudits'];

  @HasMany(() => DocumentAudit, 'approvedByDeviceId')
  approvedDocumentAudits: UserDeviceAttributes['approvedDocumentAudits'];

  @HasMany(() => DocumentAudit, 'revertedByDeviceId')
  revertedDocumentAudits: UserDeviceAttributes['revertedDocumentAudits'];

  @HasMany(() => ForumComment, 'createdByDeviceId')
  createdForumComments: UserDeviceAttributes['createdForumComments'];

  @HasMany(() => ForumComment, 'deletedByDeviceId')
  deletedForumComments: UserDeviceAttributes['deletedForumComments'];

  @HasMany(() => ForumCommentVote, 'createdByDeviceId')
  createdForumCommentVotes: UserDeviceAttributes['createdForumCommentVotes'];

  @HasMany(() => ForumCommentVote, 'deletedByDeviceId')
  deletedForumCommentVotes: UserDeviceAttributes['deletedForumCommentVotes'];

  @HasMany(() => ForumPost, 'createdByDeviceId')
  createdForumPosts: UserDeviceAttributes['createdForumPosts'];

  @HasMany(() => ForumPost, 'updatedByDeviceId')
  updatedForumPosts: UserDeviceAttributes['updatedForumPosts'];

  @HasMany(() => ForumPost, 'deletedByDeviceId')
  deletedForumPosts: UserDeviceAttributes['deletedForumPosts'];

  @HasMany(() => ForumPostView)
  forumPostViews: UserDeviceAttributes['forumPostViews'];

  @HasMany(() => ForumPostVote, 'createdByDeviceId')
  createdForumPostVotes: UserDeviceAttributes['createdForumPostVotes'];

  @HasMany(() => ForumPostVote, 'deletedByDeviceId')
  deletedForumPostVotes: UserDeviceAttributes['deletedForumPostVotes'];

  @HasMany(() => ForumReport, 'createdByDeviceId')
  createdForumReports: UserDeviceAttributes['createdForumReports'];

  @HasMany(() => ForumReport, 'feedbackByDeviceId')
  feedbackForumReports: UserDeviceAttributes['feedbackForumReports'];

  @HasMany(() => ForumReport, 'deletedByDeviceId')
  deletedForumReports: UserDeviceAttributes['deletedForumReports'];

  @HasMany(() => ForumTag)
  createdForumTags: UserDeviceAttributes['createdForumTags'];

  @HasMany(() => Image)
  createdImages: UserDeviceAttributes['createdImages'];

  @HasMany(() => MintingSchedule, 'createdByDeviceId')
  createdMintingSchedules: UserDeviceAttributes['createdMintingSchedules'];

  @HasMany(() => MintingSchedule, 'updatedByDeviceId')
  updatedMintingSchedules: UserDeviceAttributes['updatedMintingSchedules'];

  @HasMany(() => Nft)
  createdNfts: UserDeviceAttributes['createdNfts'];

  @HasMany(() => Opinion)
  createdOpinions: UserDeviceAttributes['createdOpinions'];

  @HasMany(() => OpinionVerification, 'createdByDeviceId')
  createdOpinionVerifications: UserDeviceAttributes['createdOpinionVerifications'];

  @HasMany(() => OpinionVerification, 'deletedByDeviceId')
  deletedOpinionVerifications: UserDeviceAttributes['deletedOpinionVerifications'];

  @HasMany(() => Url)
  createdUrls: UserDeviceAttributes['createdUrls'];

  @HasMany(() => UrlVerification, 'createdByDeviceId')
  createdUrlVerifications: UserDeviceAttributes['createdUrlVerifications'];

  @HasMany(() => UrlVerification, 'deletedByDeviceId')
  deletedUrlVerifications: UserDeviceAttributes['deletedUrlVerifications'];

  @HasMany(() => UserAttendance)
  userAttendanceRecords?: UserDeviceAttributes['userAttendanceRecords'];
}
