import { DataType, Model, Sequelize, Table } from 'sequelize-typescript';
import { DatabaseObject } from '.';

export const GROUP_ID_MAX_LENGTH = 32;
export type GroupIdType = string;
export const groupIdDataType = DataType.STRING(GROUP_ID_MAX_LENGTH);

export interface UserGroupCreationAttributes {
  groupId: string;
  canCreateDocument?: boolean;
  canReqeustDocumentEdit?: boolean;
  canEditDocument?: boolean;
  canVerify?: boolean;
  canReceivePoints?: boolean;
  canTransferToken?: boolean;
  canReceiveReferrals?: boolean;
  canParticipateEvent?: boolean;
}

export type UserGroupInstanceAttributes = Required<UserGroupCreationAttributes>;

@Table
export default class UserGroup extends Model<
  UserGroupCreationAttributes,
  UserGroupInstanceAttributes
> {
  public readonly groupId!: string; // primary key

  // User group privileges
  public canCreateDocument!: boolean;
  public canRequestDocumentEdit!: boolean;
  public canEditDocument!: boolean;
  public canVerify!: boolean;
  public canReceivePoints!: boolean;
  public canTransferToken!: boolean;
  public canReceiveReferrals!: boolean;
  public canParticipateEvent!: boolean;

  // Managed by Sequelize
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initUserGroup(sequelize: Sequelize) {
  return UserGroup.init(
    {
      groupId: {
        type: groupIdDataType,
        primaryKey: true,
        allowNull: false,
      },
      canCreateDocument: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canReqeustDocumentEdit: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canEditDocument: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canVerify: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canReceivePoints: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canTransferToken: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canReceiveReferrals: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canParticipateEvent: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'user_groups',
      modelName: 'UserGroup',
      timestamps: false,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );
}

export function associateUserGroup(db: DatabaseObject) {
  // Many users can be in one user group
  db.UserGroup.hasMany(db.User, {
    foreignKey: 'groupId',
  });
}
