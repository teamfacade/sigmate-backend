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
  picture?: string;
  bio?: string;
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
  public picture!: string;
  @Column
  public bio!: string;
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
      picture: {
        type: DataType.STRING(512),
      },
      bio: {
        type: DataType.TEXT,
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
