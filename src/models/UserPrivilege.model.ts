import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import Privilege, { PrivilegeAttribs } from './Privilege.model';
import PrivilegePolicy, {
  PrivilegePolicyAttribs,
} from './PrivilegePolicy.model';
import User, { UserId } from './User.model';

export interface UserPrivilegeAttribs {
  id: number;
  user?: User;
  userId?: UserId;
  privilege?: Privilege;
  privilegeId?: PrivilegeAttribs['id'];
  grant: boolean;
  policy?: PrivilegePolicy;
  policyId?: PrivilegePolicyAttribs['id'];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Through table for User and Privilege.
 * Manage privilege overrides for individual users
 */
@Table({
  modelName: 'UserPrivilege',
  tableName: 'user_privileges',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export default class UserPrivilege extends Model<UserPrivilegeAttribs> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: UserPrivilegeAttribs['id'];

  @Column(DataType.INTEGER)
  userId: UserPrivilegeAttribs['userId'];

  @Column(DataType.INTEGER)
  privilegeId: UserPrivilegeAttribs['privilegeId'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  grant!: UserPrivilegeAttribs['grant'];
}
