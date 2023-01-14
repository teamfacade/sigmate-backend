import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  Model,
} from 'sequelize-typescript';
import DeviceLocation, { DeviceLocationAttribs } from './DeviceLocation.model';
import User, { UserId } from './User.model';

export interface UserDeviceLocationAttribs {
  id: number;
  user?: User;
  userId?: UserId;
  deviceLocation?: DeviceLocation;
  deviceLocationId?: DeviceLocationAttribs['id'];

  authorize: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export default class UserDeviceLocation extends Model<UserDeviceLocationAttribs> {
  @BelongsTo(() => User, { foreignKey: 'userId' })
  user: UserDeviceLocationAttribs['user'];

  @BelongsTo(() => DeviceLocation, { foreignKey: 'deviceLocationId' })
  deviceLocation: UserDeviceLocationAttribs['deviceLocation'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  authorize!: UserDeviceLocationAttribs['authorize'];

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  lastLoginAt: UserDeviceLocationAttribs['lastLoginAt'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: UserDeviceLocationAttribs['createdAt'];
}
