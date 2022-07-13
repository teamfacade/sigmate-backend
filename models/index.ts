import { Sequelize } from 'sequelize-typescript';
import User, { associateUser, initUser } from './User';
import AdminUser, { associateAdminUser, initAdminUser } from './AdminUser';
import UserAuth, { associateUserAuth, initUserAuth } from './UserAuth';
import UserGroup, { associateUserGroup, initUserGroup } from './UserGroup';
import { getNodeEnv } from '../config';
import dbConfig from '../config/dbConfig';

const env = getNodeEnv();
const config = dbConfig[env];

export const connectDatabase = () => {
  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );

  return sequelize;
};

export const testDatabaseConnection = async (sequelize: Sequelize) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection success');
    return true;
  } catch (error) {
    console.error(error);
    console.log('❌ Database connection failed');
  }
  return false;
};

export type DatabaseObject = {
  sequelize: Sequelize;
  User: typeof User;
  AdminUser: typeof AdminUser;
  UserAuth: typeof UserAuth;
  UserGroup: typeof UserGroup;
};

// Init and associate models
export const initDatabase = (): DatabaseObject => {
  const sequelize = connectDatabase();

  // Add models
  sequelize.addModels([User, AdminUser, UserAuth, UserGroup]);

  // Init Models
  initUser(sequelize);
  initAdminUser(sequelize);
  initUserAuth(sequelize);
  initUserGroup(sequelize);

  const db = {
    sequelize,
    User,
    AdminUser,
    UserAuth,
    UserGroup,
  };

  // Associate models
  associateUser(db);
  associateUserAuth(db);
  associateAdminUser(db);
  associateUserGroup(db);

  return db;
};

const db: DatabaseObject = initDatabase();

export default db;
