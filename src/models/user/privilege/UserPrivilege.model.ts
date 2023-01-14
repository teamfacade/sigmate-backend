import {
  Table,
  Model,
  Column,
  DataType,
  AllowNull,
  BelongsTo,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User, { UserId } from '../User.model';
import Privilege, { PrivilegeAttribs } from './Privilege.model';

export interface UserPrivilegeAttribs {
  id: number;
  grant: boolean;

  user?: User;
  userId?: UserId;
  privilege?: Privilege;
  privilegeId?: PrivilegeAttribs['id'];

  createdAt: Date;
  updatedAt: Date;
}

type UserPrivilegeCAttribs = Optional<UserPrivilegeAttribs, 'id'>;

@Table({
  modelName: 'UserPrivilege',
  tableName: 'user_privileges',
  timestamps: true,
  underscored: true,
  paranoid: false,
})
export default class UserPrivilege extends Model<
  UserPrivilegeAttribs,
  UserPrivilegeCAttribs
> {
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  grant!: UserPrivilegeAttribs['grant'];

  @BelongsTo(() => User, { foreignKey: 'userId' })
  user: UserPrivilegeAttribs['user'];

  @BelongsTo(() => Privilege, { foreignKey: 'privilegeId' })
  privilege: UserPrivilegeAttribs['privilege'];
}
