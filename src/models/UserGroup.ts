import {
  DataType,
  Table,
  Model,
  Column,
  AllowNull,
  Default,
  HasMany,
} from 'sequelize-typescript';
import User from './User';

export const GROUP_ID_MAX_LENGTH = 16;
export type GroupIdType = string;
export const groupIdDataType = DataType.STRING(16);

export interface UserGroupAttributes {
  id: number;
  groupName: string;
  canCreateDocument: boolean;
  canReqeustDocumentEdit: boolean;
  canEditDocument: boolean;
  canVerify: boolean;
  canReceivePoints: boolean;
  canTransferToken: boolean;
  canReceiveReferrals: boolean;
  canParticipateEvent: boolean;
  users?: User[];
}

export type UserGroupCreationAttributes = UserGroupAttributes;

@Table({
  tableName: 'user_groups',
  modelName: 'UserGroup',
  timestamps: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserGroup extends Model<
  UserGroupAttributes,
  UserGroupCreationAttributes
> {
  @Column(DataType.STRING(16))
  groupName!: UserGroupAttributes['groupName'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canCreateDocument!: UserGroupAttributes['canCreateDocument'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canRequestDocumentEdit!: UserGroupAttributes['canReqeustDocumentEdit'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canEditDocument!: UserGroupAttributes['canEditDocument'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canVerify!: UserGroupAttributes['canVerify'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canReceivePoints!: UserGroupAttributes['canReceivePoints'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canParticipateEvent!: UserGroupAttributes['canParticipateEvent'];

  @HasMany(() => User)
  users: UserGroupAttributes['users'];
}
