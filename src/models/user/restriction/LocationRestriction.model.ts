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
import Location, { LocationAttribs } from '../Location.model';
import User, { UserId } from '../User.model';
import Restriction, { RestrictionAttribs } from './Restriction.model';

export interface LocationRestrictionAttribs {
  id: number;
  count: number;
  startedAt: Date;
  reason?: string;
  givenBy?: User;
  givenById?: UserId;

  location?: Location;
  locationId?: LocationAttribs['id'];
  restriction?: Restriction;
  restrictionId?: RestrictionAttribs['id'];
}

@Table({
  modelName: 'LocationRestriction',
  tableName: 'location_restrictions',
  timestamps: false,
  underscored: false,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class LocationRestriction extends Model<LocationRestrictionAttribs> {
  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  count!: LocationRestrictionAttribs['count'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  startedAt!: LocationRestrictionAttribs['startedAt'];

  @Length({ max: 255 })
  @Column(DataType.STRING)
  reason: LocationRestrictionAttribs['reason'];

  @BelongsTo(() => User, { foreignKey: 'givenById', as: 'givenBy' })
  givenBy: LocationRestrictionAttribs['givenBy'];

  // THROUGH
  @BelongsTo(() => User, { foreignKey: 'locationId' })
  location: LocationRestrictionAttribs['location'];

  // THROUGH
  @BelongsTo(() => Restriction, { foreignKey: 'restrictionId' })
  restriction: LocationRestrictionAttribs['restriction'];
}
