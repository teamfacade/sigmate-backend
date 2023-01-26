import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import DeviceRestriction from './restriction/DeviceRestriction.model';
import User from './User.model';
import UserDevice from './UserDevice.model';

export interface DeviceAttribs {
  id: number;
  uaHash: string;
  uaText: string;
  users?: User[];
  userDevices?: UserDevice[];
  restrictions?: DeviceRestriction[];
}

type DeviceCAttribs = Optional<DeviceAttribs, 'id'>;

export type DeviceId = DeviceAttribs['id'];

@Table({
  modelName: 'Device',
  tableName: 'devices',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export default class Device extends Model<DeviceAttribs, DeviceCAttribs> {
  @Unique('devices.uaHash')
  @AllowNull(false)
  @Column(DataType.STRING(64))
  uaHash!: DeviceAttribs['uaHash'];

  @AllowNull(false)
  @Column(DataType.TEXT)
  uaText!: DeviceAttribs['uaText'];

  @BelongsToMany(() => User, {
    through: () => UserDevice,
    as: 'users',
    foreignKey: 'deviceId',
    otherKey: 'userId',
  })
  users: DeviceAttribs['users'];

  @HasMany(() => UserDevice, {
    foreignKey: 'deviceId',
    as: 'userDevices',
  })
  userDevices: DeviceAttribs['userDevices'];

  @HasMany(() => DeviceRestriction, {
    foreignKey: 'deviceId',
    as: 'restrictions',
  })
  restrictions: DeviceAttribs['restrictions'];
}
