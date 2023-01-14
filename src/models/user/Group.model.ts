import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  IsIn,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import GroupPrivilege from './privilege/GroupPrivilege.model';
import Privilege from './privilege/Privilege.model';
import User from './User.model';

export type GroupId = GroupAttribs['id'];
export type GroupName = keyof typeof GROUPS;

export interface GroupAttribs {
  id: number;
  name: GroupName;
  users?: User[];
  privileges?: Privilege[];
}

type GroupCAttribs = Optional<GroupAttribs, 'id'>;

export const GROUPS = Object.freeze({
  inactive: 11,
  unauthenticated: 20,
  active: 30,
  verified: 31,
  admin: 40,
  team: 50,
  dev: 51,
});

export const GROUP_NAMES: GroupName[] = Object.keys(GROUPS) as GroupName[];

@Table({
  modelName: 'Group',
  tableName: 'groups',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class Group extends Model<GroupAttribs, GroupCAttribs> {
  @IsIn([[Object.keys(GROUPS)]])
  @Unique('groups.name')
  @AllowNull(false)
  @Column(DataType.STRING(32))
  name!: GroupAttribs['name'];

  @HasMany(() => User, { foreignKey: 'groupId' })
  users: GroupAttribs['users'];

  @BelongsToMany(() => Privilege, {
    through: () => GroupPrivilege,
    as: 'privileges',
    foreignKey: 'groupId',
    otherKey: 'privilegeId',
  })
  privileges: GroupAttribs['privileges'];
}
