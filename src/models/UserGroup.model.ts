import {
  AllowNull,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User from './User.model';

export interface UserGroupAttribs {
  id: number;
  name: string;
  users?: User[];
}

type UserGroupCAttribs = Optional<UserGroupAttribs, 'id'>;

@Table({
  modelName: 'user_groups',
  tableName: 'UserGroup',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class UserGroup extends Model<
  UserGroupAttribs,
  UserGroupCAttribs
> {
  @AllowNull(false)
  @Unique
  @Column(DataType.STRING(32))
  name!: UserGroupAttribs['name'];

  @HasMany(() => User, { foreignKey: 'groupId' })
  users: UserGroupAttribs['users'];
}
