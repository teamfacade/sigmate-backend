import { DateTime } from 'luxon';
import { Op } from 'sequelize';
import { RequestHandler } from 'express';
import Device from '../../models/user/Device.model';
import Location from '../../models/user/Location.model';
import DeviceRestriction from '../../models/user/restriction/DeviceRestriction.model';
import Restriction, {
  RestrictionType,
} from '../../models/user/restriction/Restriction.model';
import CacheService from './CacheService';

import { Address4, Address6 } from 'ip-address';
import RestrictionError from '../errors/RestrictionError';
import LocationRestriction from '../../models/user/restriction/LocationRestriction.model';
import User from '../../models/user/User.model';
import UserRestriction from '../../models/user/restriction/UserRestriction.model';
import UserDeviceRestriction from '../../models/user/restriction/UserDeviceRestriction.model';
import UserDevice from '../../models/user/UserDevice.model';
import UserLocation from '../../models/user/UserLocation.model';
import UserLocationRestriction from '../../models/user/restriction/UserLocationRestriction.model';
import { redis } from './RedisService';

type KeyType = {
  /** SHA1 hash of HTTP user agent header */
  device?: string;
  /** IP address */
  location?: string;
  /** User ID */
  user?: string;
};

type DataType = RestrictionType | undefined;

export default class RestrictionCacheService extends CacheService<
  KeyType,
  DataType
> {
  public static instance: RestrictionCacheService;

  constructor() {
    super({
      name: 'RestrictionCache',
      keyPrefix: 'restrict',
      keySeparator: '$',
      keyAttribOrder: ['location', 'device', 'user'],
      keyAttribDefault: '*',
      suppressTypeWarnings: true,
    });
  }

  protected async getCache(key: string): Promise<DataType | null> {
    const data = await redis.run((client) => client.get(key));
    switch (data) {
      case 'BAN':
      case 'LIMIT':
      case 'REQUIRE_AUTH':
        return data;
      case CacheService.UNDEFINED:
        return undefined;
      default:
        return null;
    }
  }

  protected async setCache(
    key: string,
    data: DataType | undefined,
    options?: { expiresInSec?: number | undefined } | undefined
  ): Promise<void> {
    const __data = data === undefined ? CacheService.UNDEFINED : data;
    await redis.run((client) =>
      client.set(key, __data, {
        EX: options?.expiresInSec || this.expiresInSec,
      })
    );
  }

  protected async getDB(
    key: KeyType
  ): Promise<{ data: DataType; expiresInSec?: number | undefined }> {
    let type: DataType = undefined; // Final returned data
    let typeValue = Infinity; // Raw db value
    let endsAt: DateTime | undefined; // Restriction lifts at (undefined == Infinite)
    const { device, location, user } = key;

    if (device && !location && !user) {
      const info = await this.getDeviceRestriction(device);
      typeValue = info.type;
      endsAt = info.endsAt;
    } else if (!device && location && !user) {
      const info = await this.getLocationRestriction(location);
      typeValue = info.type;
      endsAt = info.endsAt;
    } else if (!device && !location && user) {
      const info = await this.getUserRestriction(user);
      typeValue = info.type;
      endsAt = info.endsAt;
    } else if (device && !location && user) {
      const info = await this.getUserDeviceRestriction(device, user);
      typeValue = info.type;
      endsAt = info.endsAt;
    } else if (!device && location && user) {
      const info = await this.getUserLocationRestriction(location, user);
      typeValue = info.type;
      endsAt = info.endsAt;
    } else {
      throw new RestrictionError({
        code: 'RESTRICTION/IV_KEY',
        message: JSON.stringify(key),
      });
    }

    // Get restriction type
    if (typeValue && typeValue in Restriction.TYPE_NAMES) {
      type =
        Restriction.TYPE_NAMES[
          typeValue as keyof typeof Restriction.TYPE_NAMES
        ];
    }

    // Calculate TTL
    let expiresInSec: number | undefined = undefined;
    if (endsAt) {
      const { seconds } = DateTime.now().diff(endsAt, ['seconds']).toObject();
      expiresInSec = seconds;
    }

    return {
      data: type,
      expiresInSec,
    };
  }

  private async getDeviceRestriction(uaHash: NonNullable<KeyType['device']>) {
    let type = Infinity; // Raw datavalue from db
    let endsAt: DateTime | undefined = undefined; // Restriction lifts at (undefined == Infinity)

    const device = await Device.findOne({
      where: { uaHash },
      include: [
        {
          model: DeviceRestriction,
          as: 'restrictions',
          attributes: ['id', 'endsAt'],
          where: {
            [Op.or]: [
              { endsAt: null },
              { endsAt: { [Op.gte]: DateTime.utc().toJSDate() } },
            ],
          },
          include: [
            {
              model: Restriction,
              attributes: ['id', 'type'],
            },
          ],
          separate: true,
          limit: 1,
          order: [[Restriction, 'type', 'ASC']],
        },
      ],
    });

    if (device?.restrictions) {
      device.restrictions.forEach((deviceRestriction) => {
        const { newType, newEndsAt } = this.getRestrictionInfo(
          deviceRestriction,
          type,
          endsAt
        );
        type = newType;
        endsAt = newEndsAt;
      });
    }

    return { type, endsAt: endsAt as unknown as DateTime | undefined };
  }

  private async getLocationRestriction(
    ipAddr: NonNullable<KeyType['location']>
  ) {
    let type = Infinity; // Raw datavalue from db
    let endsAt: DateTime | undefined = undefined; // Restriction lifts at (undefined == Infinite)

    const { ipv4, ipv6 } = this.parseIp(ipAddr);

    const location = await Location.findOne({
      where: ipv4 !== undefined ? { ipv4 } : { ipv6 },
      include: [
        {
          model: LocationRestriction,
          as: 'restrictions',
          attributes: ['id', 'endsAt'],
          where: {
            [Op.or]: [
              { endsAt: null },
              { endsAt: { [Op.gte]: DateTime.utc().toJSDate() } },
            ],
          },
          include: [
            {
              model: Restriction,
              attributes: ['id', 'type'],
            },
          ],
          separate: true,
          limit: 1,
          order: [[Restriction, 'type', 'ASC']],
        },
      ],
    });

    if (location?.restrictions) {
      location.restrictions.forEach((locationRestriction) => {
        const { newType, newEndsAt } = this.getRestrictionInfo(
          locationRestriction,
          type,
          endsAt
        );
        type = newType;
        endsAt = newEndsAt;
      });
    }

    return { type, endsAt: endsAt as unknown as DateTime | undefined };
  }

  private async getUserRestriction(userId: NonNullable<KeyType['user']>) {
    let type = Infinity; // Raw datavalue from db
    let endsAt: DateTime | undefined = undefined; // Restriction lifts at (undefined == Infinite)

    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserRestriction,
          as: 'restrictions',
          attributes: ['id', 'endsAt'],
          where: {
            [Op.or]: [
              { endsAt: null },
              { endsAt: { [Op.gte]: DateTime.utc().toJSDate() } },
            ],
          },
          include: [
            {
              model: Restriction,
              attributes: ['id', 'type'],
            },
          ],
          separate: true,
          limit: 1,
          order: [[Restriction, 'type', 'ASC']],
        },
      ],
    });

    if (user?.restrictions) {
      user.restrictions.forEach((userRestriction) => {
        const { newType, newEndsAt } = this.getRestrictionInfo(
          userRestriction,
          type,
          endsAt
        );
        type = newType;
        endsAt = newEndsAt;
      });
    }

    return { type, endsAt: endsAt as unknown as DateTime | undefined };
  }

  private async getUserDeviceRestriction(
    uaHash: NonNullable<KeyType['device']>,
    userId: NonNullable<KeyType['user']>
  ) {
    let type = Infinity; // Raw datavalue from db
    let endsAt: DateTime | undefined = undefined; // Restriction lifts at (undefined == Infinite)

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Device,
          where: { uaHash },
          include: [
            {
              model: UserDevice,
              attributes: ['id'],
              include: [
                {
                  model: UserDeviceRestriction,
                  as: 'restrictions',
                  attributes: ['id', 'endsAt'],
                  where: {
                    [Op.or]: [
                      { endsAt: null },
                      { endsAt: { [Op.gte]: DateTime.utc().toJSDate() } },
                    ],
                  },
                  include: [
                    {
                      model: Restriction,
                      attributes: ['id', 'type'],
                    },
                  ],
                  separate: true,
                  limit: 1,
                  order: [[Restriction, 'type', 'ASC']],
                },
              ],
              required: true,
            },
          ],
        },
      ],
    });

    if (user?.devices) {
      user.devices.forEach((device) => {
        device.userDevices?.forEach((userDevice) => {
          userDevice.restrictions?.forEach((userDeviceRestriction) => {
            const { newType, newEndsAt } = this.getRestrictionInfo(
              userDeviceRestriction,
              type,
              endsAt
            );
            type = newType;
            endsAt = newEndsAt;
          });
        });
      });
    }

    return { type, endsAt: endsAt as unknown as DateTime | undefined };
  }

  private async getUserLocationRestriction(
    ipAddr: NonNullable<KeyType['location']>,
    userId: NonNullable<KeyType['user']>
  ) {
    let type = Infinity; // Raw datavalue from db
    let endsAt: DateTime | undefined = undefined; // Restriction lifts at (undefined == Infinite)

    const { ipv4, ipv6 } = this.parseIp(ipAddr);

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Location,
          where: ipv4 ? { ipv4 } : { ipv6 },
          include: [
            {
              model: UserLocation,
              as: 'locations',
              attributes: ['id'],
              include: [
                {
                  model: UserLocationRestriction,
                  as: 'restrictions',
                  attributes: ['id', 'endsAt'],
                  where: {
                    [Op.or]: [
                      { endsAt: null },
                      { endsAt: { [Op.gte]: DateTime.utc().toJSDate() } },
                    ],
                  },
                  include: [
                    {
                      model: Restriction,
                      attributes: ['id', 'type'],
                    },
                  ],
                  separate: true,
                  limit: 1,
                  order: [[Restriction, 'type', 'ASC']],
                },
              ],
              required: true,
            },
          ],
        },
      ],
    });

    if (user?.locations) {
      user.locations.forEach((location) => {
        location.userLocations?.forEach((userLocation) => {
          userLocation.restrictions?.forEach((userLocationRestriction) => {
            const { newType, newEndsAt } = this.getRestrictionInfo(
              userLocationRestriction,
              type,
              endsAt
            );
            type = newType;
            endsAt = newEndsAt;
          });
        });
      });
    }

    return { type, endsAt: endsAt as unknown as DateTime | undefined };
  }

  private getRestrictionInfo(
    restriction:
      | DeviceRestriction
      | LocationRestriction
      | UserRestriction
      | UserDeviceRestriction
      | UserLocationRestriction,
    type: number,
    endsAt: DateTime | undefined
  ) {
    let newType = type;
    let newEndsAt = endsAt;
    const dbType = restriction.restriction?.type;

    if (dbType && dbType < type) {
      newType = dbType;
      const dbEndsAt = restriction.endsAt
        ? DateTime.fromJSDate(restriction.endsAt).setZone('utc')
        : undefined;
      if (dbEndsAt) {
        if (!endsAt || endsAt < dbEndsAt) newEndsAt = dbEndsAt;
      } else {
        endsAt = undefined; // Endless restriction!
      }
    }

    return { newType, newEndsAt };
  }

  private parseIp(ipAddr: KeyType['location']) {
    let ipv4: number | undefined = undefined;
    let ipv6: string | undefined = undefined;
    if (ipAddr) {
      try {
        ipv4 = Number.parseFloat(new Address4(ipAddr).bigInteger());
      } catch (error) {
        ipv4 = undefined;
      }

      if (ipv4 === undefined) {
        try {
          ipv6 = new Address6(ipAddr).correctForm();
        } catch (error) {
          ipv6 = undefined;
        }
      }

      if (ipv4 === undefined && ipv6 === undefined) {
        throw new RestrictionError({
          code: 'RESTRICTION/IV_IP',
          message: String(ipAddr),
        });
      }
    }

    return { ipv4, ipv6 };
  }
}
