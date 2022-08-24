import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  Model,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User from './User';
import UserDevice from './UserDevice';

export interface UserAttendanceAttributes {
  id: number;
  user: User;
  device: UserDevice;
  createdAt: Date;
}

export type UserAttendanceCreationAttributes = Optional<
  UserAttendanceAttributes,
  'id'
>;

export default class UserAttendance extends Model<
  UserAttendanceAttributes,
  UserAttendanceCreationAttributes
> {
  @AllowNull(false)
  @BelongsTo(() => User)
  user!: UserAttendanceAttributes['user'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice)
  device!: UserAttendanceAttributes['device'];

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: UserAttendanceAttributes['createdAt'];
}
