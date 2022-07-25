import { Sequelize } from 'sequelize';
import { DataType, Table, Model, Column } from 'sequelize-typescript';
import { DatabaseObject } from '.';

export const GROUP_ID_MAX_LENGTH = 16;
export type GroupIdType = string;
export const groupIdDataType = DataType.STRING(16);

export interface UserGroupModelAttributes {
  groupId: string;
  canCreateDocument: boolean;
  canReqeustDocumentEdit: boolean;
  canEditDocument: boolean;
  canVerify: boolean;
  canReceivePoints: boolean;
  canTransferToken: boolean;
  canReceiveReferrals: boolean;
  canParticipateEvent: boolean;
}

export type UserGroupCreationAttributes = UserGroupModelAttributes;

@Table
export default class UserGroup extends Model<
  UserGroupModelAttributes,
  UserGroupCreationAttributes
> {
  @Column
  public groupId!: string;
  @Column
  public canCreateDocument!: boolean;
  @Column
  public canReqeustDocumentEdit!: boolean;
  @Column
  public canEditDocument!: boolean;
  @Column
  public canVerify!: boolean;
  @Column
  public canReceivePoints!: boolean;
  @Column
  public canTransferToken!: boolean;
  @Column
  public canReceiveReferrals!: boolean;
  @Column
  public canParticipateEvent!: boolean;
}

export const initUserGroup = (sequelize: Sequelize) => {
  UserGroup.init(
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
};

export const associateUserGroup = (db: DatabaseObject) => {
  // Many users can be in one user group
  db.UserGroup.hasMany(db.User, {
    foreignKey: 'group',
  });
};
