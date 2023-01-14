import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Group, { GroupId } from '../Group.model';
import Privilege, { PrivilegeAttribs } from './Privilege.model';

export interface GroupPrivilegeAttribs {
  id: number;
  grant: boolean;

  group?: Group;
  groupId?: GroupId;
  privilege?: Privilege;
  privilegeId?: PrivilegeAttribs['id'];

  createdAt: Date;
  updatedAt: Date;
}

type GroupPrivilegeCAttribs = Optional<GroupPrivilegeAttribs, 'id'>;

@Table({
  modelName: 'GroupPrivilege',
  tableName: 'group_privileges',
  timestamps: true,
  underscored: true,
  paranoid: false,
})
export default class GroupPrivilege extends Model<
  GroupPrivilegeAttribs,
  GroupPrivilegeCAttribs
> {
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  grant!: GroupPrivilegeAttribs['grant'];

  @BelongsTo(() => Group, { foreignKey: 'groupId' })
  group: GroupPrivilegeAttribs['group'];

  @BelongsTo(() => Privilege, { foreignKey: 'privilegeId' })
  privilege: GroupPrivilegeAttribs['privilege'];
}
