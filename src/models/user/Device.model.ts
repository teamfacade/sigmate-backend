import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import DeviceRestriction from './restriction/DeviceRestriction.model';
import Restriction from './restriction/Restriction.model';
import User from './User.model';
import UserDevice from './UserDevice.model';

export interface DeviceAttribs {
  id: number;
  uaHash: string;
  uaText: string;
  uaTextLong?: string;
  users?: User[];
  restrictions?: Restriction[];
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
  @AllowNull(false)
  @Column(DataType.STRING(32))
  uaHash!: DeviceAttribs['uaHash'];

  @AllowNull(false)
  @Column(DataType.STRING(255))
  uaText!: DeviceAttribs['uaText'];

  @Column(DataType.TEXT)
  uaTextLong: DeviceAttribs['uaTextLong'];

  @BelongsToMany(() => User, {
    through: () => UserDevice,
    as: 'users',
    foreignKey: 'deviceId',
    otherKey: 'userId',
  })
  users: DeviceAttribs['users'];

  @BelongsToMany(() => Restriction, {
    through: () => DeviceRestriction,
    as: 'restrictions',
    foreignKey: 'deviceId',
    otherKey: 'restrictionId',
  })
  restrictions: DeviceAttribs['restrictions'];
}
