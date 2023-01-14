import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Device, { DeviceId } from './Device.model';
import Location, { LocationAttribs } from './Location.model';
import User from './User.model';
import UserDeviceLocation from './UserDeviceLocation.model';

export interface DeviceLocationAttribs {
  id: number;
  device?: Device;
  deviceId?: DeviceId;
  location?: Location;
  locationId?: LocationAttribs['id'];
  users?: User[];

  createdAt: Date;
}

type DeviceLocationCAttribs = Optional<
  DeviceLocationAttribs,
  'id' | 'createdAt'
>;

@Table({
  modelName: 'DeviceLocation',
  tableName: 'device_locations',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class DeviceLocation extends Model<
  DeviceLocationAttribs,
  DeviceLocationCAttribs
> {
  @BelongsTo(() => Device, { foreignKey: 'deviceId' })
  device: DeviceLocationAttribs['device'];

  @BelongsTo(() => Location, { foreignKey: 'locationId' })
  location: DeviceLocationAttribs['location'];

  @BelongsToMany(() => User, {
    through: () => UserDeviceLocation,
    as: 'users',
    foreignKey: 'deviceLocationId',
    otherKey: 'userId',
  })
  users: DeviceLocationAttribs['users'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: DeviceLocationAttribs['createdAt'];
}
