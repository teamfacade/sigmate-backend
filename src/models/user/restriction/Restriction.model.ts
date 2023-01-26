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
  type: number;
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

export type RestrictionType = keyof typeof Restriction['TYPES'];

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
  // COLUMNS

  @IsIn([Object.values(Restriction.TYPES)])
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

  // JS ATTRIBUTES

  static TYPES = Object.freeze({
    BAN: 10,
    LIMIT: 20,
    REQUIRE_AUTH: 30,
  });

  static TYPE_NAMES = Object.freeze({
    10: 'BAN',
    20: 'LIMIT',
    30: 'REQUIRE_AUTH',
  });
}
