import { DataType, Model, Sequelize, Table } from 'sequelize-typescript';
import { DatabaseObject } from '.';
import { userIdDataType } from './User';

export type GroupIdType = number;
export const groupIdDataType = DataType.INTEGER;

export interface UserGroupCreationAttributes {
  groupId: GroupIdType;
  groupNmae: string;
  createdBy: string;
  canCreateDocument?: boolean;
  canReqeustDocumentEdit?: boolean;
  canEditDocument?: boolean;
  canVerify?: boolean;
  canReceivePoints?: boolean;
  canTransferToken?: boolean;
  canReceiveReferrals?: boolean;
  canParticiapteEvent?: boolean;
}

export type UserGroupInstanceAttributes = Required<UserGroupCreationAttributes>;

@Table
export default class UserGroup extends Model<
  UserGroupCreationAttributes,
  UserGroupInstanceAttributes
> {
  public readonly groupId!: string;
  public groupName!: string;

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
      },
      groupNmae: {
        type: DataType.STRING(32),
        unique: true,
        allowNull: false,
      },
      createdBy: {
        type: userIdDataType,
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
      canParticiapteEvent: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'user_groups',
      modelName: 'UserGroup',
      timestamps: true,
      underscored: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );
}

export function associateUserGroup(db: DatabaseObject) {
  // Many users can be in one user group
  db.UserGroup.hasMany(db.User, {
    foreignKey: 'groupId',
  });

  // One user can create many user groups
  db.UserGroup.belongsTo(db.User, {
    foreignKey: 'createdBy',
  });
}
