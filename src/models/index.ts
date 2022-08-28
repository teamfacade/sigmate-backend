import { Sequelize } from 'sequelize-typescript';
import databaseConfig from '../config/database';
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
import DocumentAuditCategory from './DocumentAuditCategory';
import DocumentCategory from './DocumentCategory';
import ForumComment from './ForumComment';
import ForumCommentVote from './ForumCommentVote';
import ForumPost from './ForumPost';
import ForumPostCategory from './ForumPostCategory';
import ForumPostImage from './ForumPostImage';
import ForumPostTag from './ForumPostTag';
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
import User from './User';
import UserAgent from './UserAgent';
import UserAttendance from './UserAttendance';
import UserAuth from './UserAuth';
import UserDevice from './UserDevice';
import UserGroup from './UserGroup';
import UserProfile from './UserProfile';
import UserSavedMintingSchedule from './UserSavedMintingSchedule';
import VerificationType from './VerificationType';

const config = databaseConfig[process.env.NODE_ENV];

const initSequelize = () => {
  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
  console.log(`✅ Successfully initialized sequelize!`);
  return sequelize;
};

export type DatabaseObject = {
  sequelize: Sequelize;
  User: typeof User;
  UserGroup: typeof UserGroup;
  UserAuth: typeof UserAuth;
  UserProfile: typeof UserProfile;
  AdminUser: typeof AdminUser;
  Document: typeof Document;
};

const initDatabase = () => {
  const sequelize = initSequelize();
  sequelize.addModels([
    AdminUser,
    Block,
    BlockAudit,
    BlockVerification,
    Category,
    Collection,
    CollectionDocumentTable,
    CollectionType,
    CollectionUtility,
    Document,
    DocumentAudit,
    DocumentAuditCategory,
    DocumentCategory,
    ForumComment,
    ForumCommentVote,
    ForumPost,
    ForumPostCategory,
    ForumPostImage,
    ForumPostTag,
    ForumPostView,
    ForumPostVote,
    ForumReport,
    ForumTag,
    Image,
    MintingSchedule,
    Nft,
    Opinion,
    OpinionVerification,
    Url,
    UrlVerification,
    User,
    UserAgent,
    UserAttendance,
    UserAuth,
    UserDevice,
    UserGroup,
    UserProfile,
    UserSavedMintingSchedule,
    VerificationType,
  ]);

  const db = {
    sequelize,
    AdminUser,
    Block,
    BlockAudit,
    BlockVerification,
    Category,
    Collection,
    CollectionDocumentTable,
    CollectionType,
    CollectionUtility,
    Document,
    DocumentAudit,
    DocumentCategory,
    ForumComment,
    ForumCommentVote,
    ForumPost,
    ForumPostView,
    ForumPostVote,
    ForumReport,
    ForumTag,
    Image,
    MintingSchedule,
    Nft,
    Opinion,
    OpinionVerification,
    Url,
    UrlVerification,
    User,
    UserAgent,
    UserAttendance,
    UserAuth,
    UserDevice,
    UserGroup,
    UserProfile,
    VerificationType,
  };

  return db;
};

const db = initDatabase();

export default db;
