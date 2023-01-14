import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  IsIn,
  Is,
  Length,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { MYSQL_VALIDATORS } from '../../../middlewares/validators';
import Device from '../Device.model';
import Location from '../Location.model';
import User from '../User.model';
import DeviceRestriction from './DeviceRestriction.model';
import LocationRestriction from './LocationRestriction.model';
import UserRestriction from './UserRestriction.model';

export interface RestrictionAttribs {
  id: number;
  type: string; // ban, throttle, limit
  description?: string;
  endsAfterMinutes?: number;

  users?: User[];
  devices?: Device[];
  locations?: Location[];

  createdAt: Date;
  updatedAt: Date;
}

type RestrictionCAttribs = Optional<
  RestrictionAttribs,
  'id' | 'createdAt' | 'updatedAt'
>;

export type RestrictionType = 'ban' | 'limit' | 'requireAuth';
export const RESTRICTION_TYPES: RestrictionType[] = [
  'ban',
  'limit',
  'requireAuth',
];

@Table({
  modelName: 'Restriction',
  tableName: 'restrictions',
  timestamps: true,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Restriction extends Model<
  RestrictionAttribs,
  RestrictionCAttribs
> {
  @IsIn([RESTRICTION_TYPES])
  @AllowNull(false)
  @Column(DataType.STRING(32))
  type!: RestrictionAttribs['type'];

  @Length({ max: 255 })
  @Column(DataType.STRING)
  description: RestrictionAttribs['description'];

  @Is('mysqlint', MYSQL_VALIDATORS.INT)
  @Column(DataType.INTEGER)
  endsAfterMinutes: RestrictionAttribs['endsAfterMinutes'];

  @BelongsToMany(() => User, {
    through: () => UserRestriction,
    as: 'users',
    foreignKey: 'restrictionId',
    otherKey: 'userId',
  })
  users: RestrictionAttribs['users'];

  @BelongsToMany(() => Device, {
    through: () => DeviceRestriction,
    as: 'devices',
    foreignKey: 'restrictionId',
    otherKey: 'deviceId',
  })
  devices: RestrictionAttribs['devices'];

  @BelongsToMany(() => Location, {
    through: () => LocationRestriction,
    as: 'locations',
    foreignKey: 'restrictionId',
    otherKey: 'locationId',
  })
  locations: RestrictionAttribs['locations'];
}
