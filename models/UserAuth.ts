import { DataType, Model, Sequelize, Table } from 'sequelize-typescript';
import { DatabaseObject } from '.';
import { userIdDataType, UserIdType } from './User';

export interface UserAuthCreationAttributes {
  userId: UserIdType;
  sigmateAccessToken?: string;
  sigmateAccessTokenExpiresAt?: Date;
  sigmateRefreshToken?: string;
  sigmateRefreshTokenExpiresAt?: Date;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

export type UserAuthInstanceAttributes = Required<UserAuthCreationAttributes>;

@Table
export default class UserAuth extends Model<
  UserAuthInstanceAttributes,
  UserAuthCreationAttributes
> {
  public readonly userId!: UserIdType;
  public sigmateAccessToken!: string;
  public sigmateAccessTokenExpiresAt!: Date;
  public sigmateRefreshToken!: string;
  public sigmateRefreshTokenExpiresAt!: Date;
  public googleAccessToken!: string;
  public googleRefreshToken!: string;
}

export function initUserAuth(sequelize: Sequelize) {
  return UserAuth.init(
    {
      userId: {
        type: userIdDataType,
        primaryKey: true,
      },
      sigmateAccessToken: {
        type: DataType.STRING(64),
      },
      sigmateAccessTokenExpiresAt: {
        type: DataType.DATE,
      },
      sigmateRefreshToken: {
        type: DataType.STRING(64),
      },
      sigmateRefreshTokenExpiresAt: {
        type: DataType.DATE,
      },
      googleAccessToken: {
        type: DataType.STRING(512),
      },
      googleRefreshToken: {
        type: DataType.STRING(255),
      },
    },
    {
      sequelize,
      tableName: 'user_auths',
      modelName: 'UserAuth',
      timestamps: false,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );
}

export function associateUserAuth(db: DatabaseObject) {
  // One user auth information per one user
  db.UserAuth.belongsTo(db.User, {
    foreignKey: 'userId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
}

export {};
