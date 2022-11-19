import {
  Table,
  Model,
  Unique,
  Column,
  DataType,
  BelongsToMany,
  BelongsTo,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User from './User.model';
import UserAgent from './UserAgent.model';
import UserDevice from './UserDevice.model';

export interface DeviceAttributes {
  id: number;
  ipv4?: string;
  ipv6?: string;
  userAgentId?: number;
  userAgent?: UserAgent;
  users?: User[];
}

type DeviceCreationAttributes = Optional<DeviceAttributes, 'id'>;

@Table({
  modelName: 'Device',
  tableName: 'devices',
  timestamps: true,
  underscored: true,
})
export default class Device extends Model<
  DeviceAttributes,
  DeviceCreationAttributes
> {
  @Unique('device')
  @Column(DataType.STRING(32))
  ipv4: DeviceAttributes['ipv4'];

  @Unique('device')
  @Column(DataType.STRING(32))
  ipv6: DeviceAttributes['ipv6'];

  @BelongsTo(() => UserAgent, 'userAgentId')
  userAgent: DeviceAttributes['userAgent'];

  @BelongsToMany(() => User, () => UserDevice)
  users: DeviceAttributes['users'];
}
