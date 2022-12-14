import {
  AfterFind,
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
import Auth, { PrivilegeMap } from '../services/auth';
import GroupPrivilege from './GroupPrivilege.model';
import Penalty from './Penalty.model';
import Privilege from './Privilege.model';
import User from './User.model';
// import PenaltyIgnoredGroup from './PenaltyIgnoredGroup';

export interface UserGroupAttribs {
  id: number;
  name: string;
  users?: User[];
  privileges?: Privilege[];
  ignoredPenalties?: Penalty[];
}

type UserGroupCAttribs = Optional<UserGroupAttribs, 'id'>;

export type UserGroupId = UserGroupAttribs['id'];

export type GroupName =
  | 'unauthenticated'
  | 'banned'
  | 'flagged'
  | 'inactive'
  | 'newbie'
  | 'active'
  | 'certified'
  | 'admin';

export const GROUP_NAMES: GroupName[] = [
  'unauthenticated',
  'banned',
  'flagged',
  'inactive',
  'newbie',
  'active',
  'certified',
  'admin',
];

@Table({
  modelName: 'UserGroup',
  tableName: 'user_groups',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class UserGroup extends Model<
  UserGroupAttribs,
  UserGroupCAttribs
> {
  @AllowNull(false)
  @Unique('user_group.name')
  @IsIn({
    msg: 'INVALID_NAME',
    args: [GROUP_NAMES],
  })
  @Column(DataType.STRING(16))
  name!: UserGroupAttribs['name'];

  @HasMany(() => User, { foreignKey: 'groupId' })
  users: UserGroupAttribs['users'];

  @BelongsToMany(() => Privilege, {
    through: () => GroupPrivilege,
    foreignKey: 'userGroupId',
    otherKey: 'privilegeId',
    as: 'privileges',
  })
  privileges: UserGroupAttribs['privileges'];

  @BelongsToMany(() => Penalty, {
    through: 'penalty_ignored_groups',
    foreignKey: 'userGroupId',
    otherKey: 'penaltyId',
    as: 'ignoredPenalties',
  })
  ignoredPenalties: UserGroupAttribs['ignoredPenalties'];

  /**
   * Object with the privilege name as the key and a boolean indicating
   * whether the privilege is granted to the group
   */
  privilegeMap?: PrivilegeMap;
  @AfterFind
  static buildPrivilegeMap(instance: UserGroup | UserGroup[]) {
    if (!(instance instanceof Array)) {
      instance = [instance];
    }
    instance.forEach((i) => {
      const privileges = i.getDataValue('privileges') || [];
      // Build an object mapping...
      i.privilegeMap = Auth.buildPrivilegeMap(privileges, 'group');
    });
  }
}
