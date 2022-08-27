import { Sequelize } from 'sequelize-typescript';
import databaseConfig from '../config/database';
import AdminUser, { associateAdminUser, initAdminUser } from './AdminUser';
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
import User, { associateUser, initUser } from './User';
import UserAgent from './UserAgent';
import UserAttendance from './UserAttendance';
import UserAuth, { associateUserAuth, initUserAuth } from './UserAuth';
import UserDevice from './UserDevice';
import UserGroup, { associateUserGroup, initUserGroup } from './UserGroup';
import UserProfile, {
  associateUserProfile,
  initUserProfile,
} from './UserProfile';
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
    User,
    UserGroup,
    UserAuth,
    UserProfile,
    AdminUser,
    UserAgent,
    UserDevice,
    UserAttendance,

    Document,
    DocumentAudit,
    Block,
    BlockAudit,
    BlockVerification,
    Opinion,
    OpinionVerification,
    Url,
    UrlVerification,
    VerificationType,
    Category,
    Collection,
    CollectionDocumentTable,
    CollectionType,
    CollectionUtility,
    Nft,
    Image,
    MintingSchedule,

    ForumComment,
    ForumCommentVote,
    ForumPost,
    ForumPostView,
    ForumPostVote,
    ForumReport,
    ForumTag,
  ]);

  initUser(sequelize);
  initUserGroup(sequelize);
  initUserAuth(sequelize);
  initUserProfile(sequelize);
  initAdminUser(sequelize);

  const db: DatabaseObject = {
    sequelize,
    User,
    UserGroup,
    UserAuth,
    UserProfile,
    AdminUser,
    Document,
  };

  associateUser(db);
  associateUserGroup(db);
  associateUserAuth(db);
  associateUserProfile(db);
  associateAdminUser(db);

  return db;
};

const db = initDatabase();

export default db;
