import { Optional } from 'sequelize/types';
import Require from '../types/Require';
import {
  Model,
  Sequelize,
  DataType,
  Table,
  Column,
} from 'sequelize-typescript';
import { groupIdDataType, GroupIdType } from './UserGroup';
import { DatabaseObject } from '.';

export type UserIdType = string;
export const userIdDataType = DataType.UUID;

export interface UserModelAttributes {
  userId: UserIdType;
  googleAccountId?: string;
  userName: string;
  email: string;
  emailVerified: boolean;
  group: GroupIdType;
  primaryProfile: number;
  isTester: boolean;
  isAdmin: boolean;
  metamaskWallet?: string;
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
}

export type UserCreationAttributes = Optional<
  UserModelAttributes,
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

export type UserDTO = Require<Partial<UserModelAttributes>, 'userId'>;
export type UserCreationDTO = Require<Omit<UserDTO, 'userId'>, 'email'>;

const defaultPreferences = {
  emailEssential: true,
  emailMarketing: false,
  cookiesEssential: true,
  cookiesAnalytics: false,
  cookiesFunctional: false,
  cookiesTargeting: false,
  agreeTos: null,
  agreePrivacy: null,
  agreeLegal: null,
};

export const availableThemes = ['light', 'dark', 'auto'];

@Table
export default class User extends Model<
  UserModelAttributes,
  UserCreationAttributes
> {
  @Column
  public readonly userId!: UserIdType; // primary key
  @Column
  public googleAccountId!: string;
  @Column
  public userName!: string;
  @Column
  public email!: string;
  @Column
  public emailVerified!: boolean;
  @Column
  public group!: string;
  @Column
  public primaryProfile!: number;
  @Column
  public isTester!: boolean;
  @Column
  public isAdmin!: boolean;
  @Column
  public metamaskWallet!: string;
  @Column
  public lastLoginAt!: Date;
  @Column
  public locale!: string;
  @Column
  public theme!: string;
  @Column
  public emailEssential!: boolean;
  @Column
  public emailMarketing!: boolean;
  @Column
  public cookiesEssential!: boolean;
  @Column
  public cookiesAnalytics!: boolean;
  @Column
  public cookiesFunctional!: boolean;
  @Column
  public cookiesTargeting!: boolean;
  @Column
  public agreeTos!: Date;
  @Column
  public agreePrivacy!: Date;
  @Column
  public agreeLegal!: Date;
}

export function initUser(sequelize: Sequelize) {
  User.init(
    {
      userId: {
        type: userIdDataType,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
      },
      googleAccountId: {
        type: DataType.STRING(32 + 15), // 15: for soft deletion edits
        unique: true,
      },
      userName: {
        type: DataType.STRING(36 + 15), // 15: for soft deletion edits
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataType.STRING(256 + 15), // 15: for soft deletion edits
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
        defaultValue: 'newbie',
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
      metamaskWallet: {
        type: DataType.STRING(64),
      },
      lastLoginAt: {
        type: DataType.DATE,
        defaultValue: DataType.NOW,
      },
      locale: {
        type: DataType.STRING(5),
      },
      theme: {
        type: DataType.STRING(5),
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

export const associateUser = (db: DatabaseObject) => {
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

  // One user can appoint many admin users
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
};