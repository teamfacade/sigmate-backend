import {
  Table,
  Model,
  AllowNull,
  Column,
  DataType,
  Default,
  Length,
  BelongsTo,
} from 'sequelize-typescript';
import User, { UserId } from '../User.model';
import UserDevice, { UserDeviceAttribs } from '../UserDevice.model';
import Restriction, { RestrictionAttribs } from './Restriction.model';

export interface UserDeviceRestrictionAttribs {
  id: number;
  /** The Nth time a user has been restricted */
  count: number;
  startedAt: Date;
  endsAt?: Date | null;
  reason?: string;
  givenBy?: User;
  givenById?: UserId;

  userDevice?: UserDevice;
  userDeviceId?: UserDeviceAttribs['id'];
  restriction?: Restriction;
  restrictionId?: RestrictionAttribs['id'];
}

@Table({
  modelName: 'UserDeviceRestriction',
  tableName: 'user_device_restrictions',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserDeviceRestriction extends Model<UserDeviceRestrictionAttribs> {
  @Default(1)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  count!: UserDeviceRestrictionAttribs['count'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  startedAt!: UserDeviceRestrictionAttribs['startedAt'];

  @Column(DataType.DATE)
  endsAt: UserDeviceRestrictionAttribs['endsAt'];

  @Length({ max: 255 })
  @Column(DataType.STRING)
  reason: UserDeviceRestrictionAttribs['reason'];

  @BelongsTo(() => User, { foreignKey: 'givenById', as: 'givenBy' })
  givenBy: UserDeviceRestrictionAttribs['givenBy'];

  @BelongsTo(() => UserDevice, { foreignKey: 'userDeviceId' })
  userDevice: UserDeviceRestrictionAttribs['userDevice'];

  @BelongsTo(() => Restriction, { foreignKey: 'restrictionId' })
  restriction: UserDeviceRestrictionAttribs['restriction'];
}
