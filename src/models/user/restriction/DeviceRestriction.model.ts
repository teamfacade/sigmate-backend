import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  Length,
  Model,
  Table,
} from 'sequelize-typescript';
import Device, { DeviceId } from '../Device.model';
import User, { UserId } from '../User.model';
import Restriction, { RestrictionAttribs } from './Restriction.model';

export interface DeviceRestrictionAttribs {
  id: number;
  /** The Nth time a device has been restricted */
  count: number;
  startedAt: Date;
  endsAt?: Date | null;
  reason?: string;
  givenBy?: User;
  givenById?: UserId;

  device?: Device;
  deviceId?: DeviceId;
  restriction?: Restriction;
  restrictionId?: RestrictionAttribs['id'];
}

@Table({
  modelName: 'DeviceRestriction',
  tableName: 'device_restrictions',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class DeviceRestriction extends Model<DeviceRestrictionAttribs> {
  @Default(1)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  count!: DeviceRestrictionAttribs['count'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  startedAt!: DeviceRestrictionAttribs['startedAt'];

  @Column(DataType.DATE)
  endsAt: DeviceRestrictionAttribs['endsAt'];

  @Length({ max: 255 })
  @Column(DataType.STRING)
  reason: DeviceRestrictionAttribs['reason'];

  @BelongsTo(() => User, { foreignKey: 'givenById', as: 'givenBy' })
  givenBy: DeviceRestrictionAttribs['givenBy'];

  // THROUGH
  @BelongsTo(() => Device, { foreignKey: 'deviceId' })
  device: DeviceRestrictionAttribs['device'];

  // THROUGH
  @BelongsTo(() => Restriction, { foreignKey: 'restrictionId' })
  restriction: DeviceRestrictionAttribs['restriction'];
}
