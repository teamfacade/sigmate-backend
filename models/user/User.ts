import { DataType, Model, Sequelize, Table } from 'sequelize-typescript';
import { groupIdDataType, GroupIdType } from './UserGroup';
import { DatabaseObject } from '../';

export type UserIdType = string;
export const userIdDataType = DataType.UUID;

export interface UserCreationAttributes {
  userId: UserIdType;
  userName: string;
  email: string;
  emailVerified?: boolean;
  group?: GroupIdType;
  primaryProfile?: number;
  isTester?: boolean;
  isAdmin?: boolean;
  googleAccount?: string;
  googleProfileId?: string;
  twitterAccount?: string;
  discordAccount?: string;
  metamaskWallet?: string;
  lastLoginAt?: Date;
  locale?: string;
  theme?: string;
  emailEssential?: boolean;
  emailMarketing?: boolean;
  cookiesEssential?: boolean;
  cookiesAnalytics?: boolean;
  cookiesFunctional?: boolean;
  cookiesTargeting?: boolean;
  agreeTos?: Date;
  agreePrivacy?: Date;
  agreeLegal?: Date;
}

export type UserInstanceAttributes = Required<UserCreationAttributes>;

export const defaultPreferences = {
  locale: 'en-US',
  theme: 'light',
  emailEssential: true,
  emailMarketing: true,
  cookiesEssential: true,
  cookiesAnalytics: false,
  cookiesFunctional: false,
  cookiesTargeting: false,
  agreeTos: null,
  agreePrivacy: null,
  agreeLegal: null,
};

@Table
export default class User extends Model<
  UserInstanceAttributes,
  UserCreationAttributes
> {
  // Basic user info
  public readonly userId!: string;
  public userName!: string;
  public email!: string;
  public emailVerified!: boolean;
  public isTester!: boolean;
  public isAdmin!: boolean;
  public googleAccount!: string;
  public googleProfileId!: string;
  public twitterAccount!: string;
  public discordAccount!: string;
  public metamaskWallet!: string;
  public lastLoginAt!: Date;

  // User preferences
  public locale!: string;
  public theme!: string;
  public emailEssential!: boolean;
  public emailMarketing!: boolean;
  public cookiesEssential!: boolean;
  public cookiesAnalytics!: boolean;
  public cookiesFunctional!: boolean;
  public cookiesTargeting!: boolean;
  public agreeTos!: Date;
  public agreePrivacy!: Date;
  public agreeLegal!: Date;

  // Associations
  public group!: GroupIdType;
  public primaryProfile!: number;

  // Managed by Sequelize
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

export function initUser(sequelize: Sequelize) {
  return User.init(
    {
      userId: {
        type: userIdDataType,
        primaryKey: true,
      },
      userName: {
        type: DataType.STRING(36),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataType.STRING(256),
        allowNull: false,
        unique: true,
      },
      emailVerified: {
        type: DataType.BOOLEAN,
        defaultValue: false,
      },
      group: {
        type: groupIdDataType,
        allowNull: false,
        defaultValue: 'unauthenticated',
      },
      primaryProfile: {
        type: DataType.INTEGER,
      },
      isTester: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isAdmin: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      googleAccount: {
        type: DataType.STRING(256),
      },
      googleProfileId: {
        type: DataType.STRING(512),
        unique: true,
      },
      twitterAccount: {
        type: DataType.STRING(16),
      },
      discordAccount: {
        type: DataType.STRING(37),
      },
      metamaskWallet: {
        type: DataType.STRING(64),
      },
      lastLoginAt: {
        type: DataType.DATE,
        defaultValue: DataType.NOW,
      },
      locale: {
        type: DataType.STRING(5),
        allowNull: false,
        defaultValue: defaultPreferences.locale,
      },
      theme: {
        type: DataType.STRING(5),
        allowNull: false,
        defaultValue: defaultPreferences.theme,
      },
      emailEssential: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: defaultPreferences.emailEssential,
      },
      emailMarketing: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: defaultPreferences.emailMarketing,
      },
      cookiesEssential: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: defaultPreferences.cookiesEssential,
      },
      cookiesAnalytics: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: defaultPreferences.cookiesAnalytics,
      },
      cookiesFunctional: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: defaultPreferences.cookiesFunctional,
      },
      cookiesTargeting: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: defaultPreferences.cookiesTargeting,
      },
      agreeTos: {
        type: DataType.DATE,
      },
      agreePrivacy: {
        type: DataType.DATE,
      },
      agreeLegal: {
        type: DataType.DATE,
      },
    },
    {
      sequelize,
      tableName: 'users',
      modelName: 'User',
      timestamps: true,
      underscored: true,
      paranoid: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );
}

export function associateUser(db: DatabaseObject) {
  // Many users can be in one user group
  db.User.belongsTo(db.UserGroup, {
    foreignKey: 'group',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  // One user can be one admin user
  db.User.hasOne(db.AdminUser, {
    foreignKey: 'userId',
  });

  // One user can apooint many admin users
  db.User.hasMany(db.AdminUser, {
    foreignKey: 'appointedBy',
  });

  // One user has one user auth information set
  db.User.hasOne(db.UserAuth, {
    foreignKey: 'userId',
  });

  // One user can have many profiles
  db.User.hasMany(db.UserProfile, {
    foreignKey: 'userId',
  });

  // One user can have one default profile
  db.User.belongsTo(db.UserProfile, {
    foreignKey: 'primaryProfile',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
}
