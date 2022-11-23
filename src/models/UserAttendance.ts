import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User, { UserAttributes } from './User';
import UserDevice, { UserDeviceAttributes } from './UserDevice';

export interface UserAttendanceAttributes {
  id: number;
  createdBy?: User;
  createdById?: UserAttributes['id'];
  createdByDevice?: UserDevice;
  createdByDeviceId?: UserDeviceAttributes['id'];
  createdAt: Date;
}

export type UserAttendanceCreationAttributes = Optional<
  UserAttendanceAttributes,
  'id'
>;

@Table({
  tableName: 'user_attendances',
  modelName: 'UserAttendance',
  timestamps: false,
  underscored: true,
})
export default class UserAttendance extends Model<
  UserAttendanceAttributes,
  UserAttendanceCreationAttributes
> {
  @BelongsTo(() => User, 'createdById')
  createdBy!: UserAttendanceAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: UserAttendanceAttributes['createdByDevice'];

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: UserAttendanceAttributes['createdAt'];
}
