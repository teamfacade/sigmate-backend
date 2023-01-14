import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { Address4, Address6 } from 'ip-address';
import User from './User.model';
import UserLocation from './UserLocation.model';
import { getUnsignedByteArray } from '../../utils';
import Restriction from './restriction/Restriction.model';
import LocationRestriction from './restriction/LocationRestriction.model';

export interface LocationAttribs {
  id: number;
  ipv4?: number; // INT
  ipAddr4?: string;
  ipv6?: string; // VARCHAR BINARY(16)
  ipAddr6?: string;
  users?: User[];
  restrictions?: Restriction[];
}

type LocationCAttribs = Optional<LocationAttribs, 'id'>;

@Table({
  modelName: 'Location',
  tableName: 'locations',
  timestamps: false,
  underscored: true,
})
export default class Location extends Model<LocationAttribs, LocationCAttribs> {
  @Unique('location.ip')
  @Column(DataType.INTEGER)
  ipv4: LocationAttribs['ipv4'];

  @Column(DataType.VIRTUAL)
  get ipAddr4(): LocationAttribs['ipAddr4'] {
    const ipv4 = this.getDataValue('ipv4');
    if (ipv4 === undefined) return undefined;
    return Address4.fromInteger(ipv4).correctForm();
  }
  set ipAddr4(value) {
    if (typeof value === 'string') {
      const addr = new Address4(value);
      this.setDataValue('ipv4', Number.parseInt(addr.bigInteger()));
    } else {
      this.setDataValue('ipv4', undefined);
    }
  }

  @Unique('location.ip')
  @Column(DataType.STRING({ length: 128, binary: true }))
  ipv6: LocationAttribs['ipv6'];

  @Column(DataType.VIRTUAL)
  get ipAddr6(): LocationAttribs['ipAddr6'] {
    const ipv6 = this.getDataValue('ipv6');
    if (ipv6 === undefined) return undefined;
    const uba = getUnsignedByteArray(ipv6);
    const addr6 = Address6.fromUnsignedByteArray(uba);
    return addr6.correctForm();
  }
  set ipAddr6(value) {
    if (typeof value === 'string') {
      const addr6 = new Address6(value);
      this.setDataValue('ipv6', addr6.binaryZeroPad());
    } else {
      this.setDataValue('ipv6', undefined);
    }
  }

  @BelongsToMany(() => User, {
    through: () => UserLocation,
    as: 'users',
    foreignKey: 'locationId',
    otherKey: 'userId',
  })
  users: LocationAttribs['users'];

  @BelongsToMany(() => Restriction, {
    through: () => LocationRestriction,
    as: 'restrictions',
    foreignKey: 'locationId',
    otherKey: 'restrictionId',
  })
  restrictions: LocationAttribs['restrictions'];
}
