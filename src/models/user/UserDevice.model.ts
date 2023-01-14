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
import Device, { DeviceId } from './Device.model';
import User, { UserId } from './User.model';

export interface UserDeviceAttribs {
  id: number;
  user?: User;
  userId?: UserId;
  device?: Device;
  deviceId?: DeviceId;
  createdAt: Date;
}

type UserDeviceCAttribs = Optional<UserDeviceAttribs, 'id' | 'createdAt'>;

@Table({
  modelName: 'UserDevice',
  tableName: 'user_devices',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class UserDevice extends Model<
  UserDeviceAttribs,
  UserDeviceCAttribs
> {
  @BelongsTo(() => User, { foreignKey: 'userId' })
  user: UserDeviceAttribs['user'];

  @BelongsTo(() => Device, { foreignKey: 'deviceId' })
  device: UserDeviceAttribs['device'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: UserDeviceAttribs['createdAt'];
}
