import { Model, Sequelize, Table, DataType } from 'sequelize-typescript';
import { DatabaseObject } from '.';
import { userIdDataType, UserIdType } from './User';

export type ProfileIdType = number;
export const profileIdDataType = DataType.INTEGER;

export interface UserProfileCreationAttributes {
  profileId?: ProfileIdType;
  userId: UserIdType;
  isDefaultProfile: boolean;
  displayName?: string;
  displayEmail?: string;
  profilePictureSrc?: string;
  bio?: string;
  organization?: string;
  websiteUrl?: string;
  twitterHandle?: string;
  twitterVerified?: boolean;
  discordInviteCode?: string;
  discordVerified?: boolean;
}

type UserProfileInstanceAttributes = Required<UserProfileCreationAttributes>;

@Table
export default class UserProfile extends Model<
  UserProfileInstanceAttributes,
  UserProfileCreationAttributes
> {
  public readonly profileId!: ProfileIdType; // primary key
  public userId!: UserIdType; // foreign key
  public isDefaultProfile!: boolean;
  public displayName!: string;
  public displayEmail!: string;
  public profilePictureSrc!: string;
  public bio!: string;
  public organization!: string;
  public websiteUrl!: string;
  public twitterHandle!: string;
  public twitterHandleVerified!: boolean;
  public discordInviteCode!: string;
  public discordVerified!: boolean;
}

export function initUserProfile(sequelize: Sequelize) {
  return UserProfile.init(
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
      isDefaultProfile: {
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
      profilePictureSrc: {
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
      twitterHandle: {
        type: DataType.STRING(16),
      },
      twitterVerified: {
        type: DataType.BOOLEAN,
      },
      discordInviteCode: {
        type: DataType.STRING(16),
      },
      discordVerified: {
        type: DataType.BOOLEAN,
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
}

export const associateUserProfile = (db: DatabaseObject) => {
  // Many user profiles belong to one user
  db.UserProfile.belongsTo(db.User, {
    foreignKey: 'userId',
  });
};
