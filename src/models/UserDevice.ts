import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { intToIp, ipToInt } from '../utils/ipAddress';
import UserAgent from './UserAgent';

export type UserDeviceIdType = number;

export interface UserDeviceAttributes {
  id: UserDeviceIdType;
  ipv4: number;
  userAgentId: number; // fk: UserAgent
  userAgent: UserAgent;
  isFlagged: boolean;
  isBlocked: boolean;
  remarks?: string;
}

export type UserDeviceCreationAttributes = Optional<
  UserDeviceAttributes,
  'id' | 'isFlagged' | 'isBlocked'
>;

@Table({
  tableName: 'user_devices',
  modelName: 'UserDevice',
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserDevice extends Model<
  UserDeviceAttributes,
  UserDeviceCreationAttributes
> {
  @Unique('device')
  @AllowNull(false)
  @Column(DataType.INTEGER)
  get ipv4(): string {
    return intToIp(this.getDataValue('ipv4'));
  }
  set ipv4(value: string) {
    this.setDataValue('ipv4', ipToInt(value));
  }

  @Unique('device')
  @AllowNull(false)
  @ForeignKey(() => UserAgent)
  @Column(DataType.INTEGER)
  userAgentId!: UserDeviceAttributes['userAgentId'];

  @BelongsTo(() => UserAgent, 'userAgentId')
  userAgent!: UserDeviceAttributes['userAgent'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isFlagged!: UserDeviceAttributes['isFlagged'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isBlocked!: UserDeviceAttributes['isBlocked'];

  @Column(DataType.STRING)
  remarks!: UserDeviceAttributes['remarks'];
}
