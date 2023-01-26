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
import UserLocation, { UserLocationAttribs } from '../UserLocation.model';
import Restriction, { RestrictionAttribs } from './Restriction.model';

export interface UserLocationRestrictionAttribs {
  id: number;
  /** The Nth time a user has been restricted */
  count: number;
  startedAt: Date;
  endsAt?: Date | null;
  reason?: string;
  givenBy?: User;
  givenById?: UserId;

  userLocation?: UserLocation;
  userLocationId?: UserLocationAttribs['id'];
  restriction?: Restriction;
  restrictionId?: RestrictionAttribs['id'];
}

@Table({
  modelName: 'UserLocationRestriction',
  tableName: 'user_location_restrictions',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserLocationRestriction extends Model<UserLocationRestrictionAttribs> {
  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  count!: UserLocationRestrictionAttribs['count'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  startedAt!: UserLocationRestrictionAttribs['startedAt'];

  @Column(DataType.DATE)
  endsAt: UserLocationRestrictionAttribs['endsAt'];

  @Length({ max: 255 })
  @Column(DataType.STRING)
  reason: UserLocationRestrictionAttribs['reason'];

  @BelongsTo(() => User, { foreignKey: 'givenById', as: 'givenBy' })
  givenBy: UserLocationRestrictionAttribs['givenBy'];

  @BelongsTo(() => UserLocation, { foreignKey: 'userLocationId' })
  userLocation: UserLocationRestrictionAttribs['userLocation'];

  @BelongsTo(() => Restriction, { foreignKey: 'restrictionId' })
  restriction: UserLocationRestrictionAttribs['restriction'];
}
