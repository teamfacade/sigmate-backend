import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Location, { LocationAttribs } from './Location.model';
import UserLocationRestriction from './restriction/UserLocationRestriction.model';
import User, { UserId } from './User.model';

export interface UserLocationAttribs {
  id: number;
  user?: User;
  userId?: UserId;
  location?: Location;
  locationId?: LocationAttribs['id'];
  createdAt: Date;
  restrictions?: UserLocationRestriction[];
}

type UserLocationCAttribs = Optional<UserLocationAttribs, 'id' | 'createdAt'>;

@Table({
  modelName: 'UserLocation',
  tableName: 'user_locations',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class UserLocation extends Model<
  UserLocationAttribs,
  UserLocationCAttribs
> {
  @BelongsTo(() => User, { foreignKey: 'userId' })
  user: UserLocationAttribs['user'];

  @BelongsTo(() => Location, { foreignKey: 'locationId' })
  location: UserLocationAttribs['location'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: UserLocationAttribs['createdAt'];

  @HasMany(() => UserLocationRestriction, {
    foreignKey: 'userLocationId',
    as: 'restrictions',
  })
  restrictions: UserLocationAttribs['restrictions'];
}
