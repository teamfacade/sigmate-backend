import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  Table,
} from 'sequelize-typescript';
import Privilege, { PrivilegeAttribs } from './Privilege.model';
import UserGroup, { UserGroupAttribs } from './UserGroup.model';

export interface GroupPrivilegeAttribs {
  userGroup?: UserGroup;
  userGroupId?: UserGroupAttribs['id'];
  privilege?: Privilege;
  privilegeId?: PrivilegeAttribs['id'];
  grant: boolean;
}

/**
 * Through table for UserGroup and Privilege.
 * Manage group privileges
 */
@Table({
  modelName: 'GroupPrivilege',
  tableName: 'group_privileges',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class GroupPrivilege extends Model<GroupPrivilegeAttribs> {
  @Column(DataType.INTEGER)
  userGroupId: GroupPrivilegeAttribs['userGroupId'];

  @Column(DataType.INTEGER)
  privilegeId: GroupPrivilegeAttribs['privilegeId'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  grant!: GroupPrivilegeAttribs['grant'];
}
