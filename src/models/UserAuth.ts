import {
  Model,
  Sequelize,
  DataType,
  Table,
  Column,
} from 'sequelize-typescript';
import { DatabaseObject } from '.';
import { userIdDataType, UserIdType } from './User';

export interface UserAuthModelAttributes {
  userId: UserIdType;
  sigmateAccessToken?: string;
  sigmateRefreshToken?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

export type UserAuthCreationAttributes = UserAuthModelAttributes;

export type UserAuthDTO = Partial<UserAuthModelAttributes>;
export type UserAuthCreationDTO = UserAuthCreationAttributes;

@Table
export default class UserAuth extends Model<
  UserAuthModelAttributes,
  UserAuthCreationAttributes
> {
  @Column
  public readonly userId!: UserIdType;
  @Column
  public sigmateAccessToken!: string;
  @Column
  public sigmateRefreshToken!: string;
  @Column
  public googleAccessToken!: string;
  @Column
  public googleRefreshToken!: string;
}

export const initUserAuth = (sequelize: Sequelize) => {
  UserAuth.init(
    {
      userId: {
        type: userIdDataType,
        primaryKey: true,
      },
      sigmateAccessToken: {
        type: DataType.STRING(512),
      },
      sigmateRefreshToken: {
        type: DataType.STRING(512),
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
};

export const associateUserAuth = (db: DatabaseObject) => {
  // One user auth information per one user
  db.UserAuth.belongsTo(db.User, {
    foreignKey: 'userId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
};
