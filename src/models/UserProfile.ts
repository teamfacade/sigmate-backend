import {
  Model,
  Sequelize,
  Table,
  DataType,
  Column,
  HasOne,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { DatabaseObject } from '.';
import Require from '../types/Require';
import User, { userIdDataType, UserIdType } from './User';

export type ProfileIdType = number;
export const profileIdDataType = DataType.INTEGER;

export interface UserProfileModelAttributes {
  profileId: ProfileIdType;
  userId: UserIdType;
  isPrimary: boolean;
  displayName?: string;
  displayEmail?: string;
  displayEmailVerified?: string;
  picture?: string;
  bio?: string;
  organization?: string;
  websiteUrl?: string;
  googleAccount?: string;
  googleAccountId?: string;
  twitterHandle?: string;
  twitterVerified?: boolean;
  discordAccount?: string;
  discordInviteCode?: string;
  discordVerified?: boolean;
  team?: number;
}

export type UserProfileCreationAttributes = Optional<
  UserProfileModelAttributes,
  'profileId' | 'isPrimary'
>;

export type UserProfileDTO = Partial<UserProfileModelAttributes>;
export type UserProfileCreationDTO = Require<UserProfileDTO, 'userId'>;

@Table
export default class UserProfile extends Model<
  UserProfileModelAttributes,
  UserProfileCreationAttributes
> {
  @Column
  public readonly profileId!: ProfileIdType;
  @Column
  public userId!: UserIdType;
  @Column
  public isPrimary!: boolean;
  @Column
  public displayName!: string;
  @Column
  public displayEmail!: string;
  @Column
  public displayEmailVerified!: string;
  @Column
  public picture!: string;
  @Column
  public bio!: string;
  @Column
  public organization!: string;
  @Column
  public websiteUrl!: string;
  @Column
  public googleAccount!: string;
  @Column
  public googleAccountId!: string;
  @Column
  public twitterHandle!: string;
  @Column
  public twitterVerified!: boolean;
  @Column
  public discordInviteCode!: string;
  @Column
  public discordVerified!: boolean;
  @Column
  public team!: number;

  @HasOne(() => User, 'primaryProfileId')
  public primaryUser!: User;
}

export const initUserProfile = (sequelize: Sequelize) => {
  UserProfile.init(
    {
      profileId: {
        type: profileIdDataType,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: userIdDataType,
        allowNull: false,
      },
      isPrimary: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      displayName: {
        type: DataType.STRING(128),
      },
      displayEmail: {
        type: DataType.STRING(255),
      },
      displayEmailVerified: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      picture: {
        type: DataType.STRING(512),
      },
      bio: {
        type: DataType.TEXT,
      },
      organization: {
        type: DataType.STRING(128),
      },
      websiteUrl: {
        type: DataType.STRING(512),
      },
      googleAccount: {
        type: DataType.STRING(256),
      },
      googleAccountId: {
        type: DataType.STRING(32),
      },
      twitterHandle: {
        type: DataType.STRING(16),
      },
      twitterVerified: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      discordAccount: {
        type: DataType.STRING(64),
      },
      discordInviteCode: {
        type: DataType.STRING(16),
      },
      discordVerified: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      team: {
        type: DataType.INTEGER,
      },
    },
    {
      sequelize,
      tableName: 'user_profiles',
      modelName: 'UserProfile',
      timestamps: true,
      paranoid: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );
};

export const associateUserProfile = (db: DatabaseObject) => {
  // Many user profiles belong to one user
  db.UserProfile.belongsTo(db.User, {
    foreignKey: 'userId',
  });

  // One default user profile exist for one user
  db.UserProfile.hasOne(db.User, {
    foreignKey: 'primaryProfileId',
    as: 'primaryProfile',
  });
};
