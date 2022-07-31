import { Sequelize } from 'sequelize-typescript';
import databaseConfig from '../config/database';
import AdminUser, { associateAdminUser, initAdminUser } from './AdminUser';
import Document from './Document';
import User, { associateUser, initUser } from './User';
import UserAuth, { associateUserAuth, initUserAuth } from './UserAuth';
import UserGroup, { associateUserGroup, initUserGroup } from './UserGroup';
import UserProfile, {
  associateUserProfile,
  initUserProfile,
} from './UserProfile';

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
    Document,
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
