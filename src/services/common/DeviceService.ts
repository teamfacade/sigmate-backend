import crypto from 'crypto';
import { Address4, Address6 } from 'ip-address';
import UAParser from 'ua-parser-js';
import isIP from 'validator/lib/isIP';
import services from '..';
import Device, { DeviceAttributes } from '../../models/Device.model';
import UserAgent, { UserAgentAttributes } from '../../models/UserAgent.model';
import BaseService from './base/BaseService';
import DeviceError from './errors/DeviceError';

type DeviceDTO = Pick<DeviceAttributes, 'ipv4' | 'ipv6'> &
  Omit<UserAgentAttributes, 'id'>;

export default class DeviceService extends BaseService {
  model?: Device;

  constructor(device: Device | undefined = undefined) {
    super();
    if (device) this.model = device;
  }

  private parseIp(ip: string | undefined): Pick<DeviceDTO, 'ipv4' | 'ipv6'> {
    if (!ip) throw new DeviceError('DEVICE/INIT/IP/UNDEFINED');
    let addr4: Address4 | undefined = undefined;
    let addr6: Address6 | undefined = undefined;

    try {
      if (isIP(ip, 4)) {
        addr4 = new Address4(ip);
      } else if (isIP(ip, 6)) {
        addr6 = new Address6(ip);
        if (addr6.v4) addr4 = addr6.address4;
      } else {
        throw new DeviceError('DEVICE/INIT/IP/INVALID');
      }
    } catch (error) {
      throw new DeviceError('DEVICE/INIT/IP/INVALID');
    }

    let ipv4: string | undefined = undefined;
    let ipv6: string | undefined = undefined;

    if (addr4) {
      ipv4 = addr4.addressMinusSuffix || addr4.address;
    }
    if (addr6) {
      ipv6 = addr6.addressMinusSuffix || addr6.address;
    }

    return {
      ipv4,
      ipv6,
    };
  }

  private parseUserAgent(
    userAgent: string | undefined
  ): Omit<DeviceDTO, 'ipv4' | 'ipv6'> {
    const uaText = userAgent || '';
    const uaHash = crypto.createHash('md5').update(uaText).digest('hex');
    const uaParsed = UAParser(uaText);
    const browser = uaParsed.browser.name || '';
    const os = uaParsed.os.name || '';
    const deviceVendor = uaParsed.device.vendor || '';
    const deviceModel = uaParsed.device.model || '';
    const deviceType = uaParsed.device.type || '';

    return {
      uaText,
      uaHash,
      browser,
      os,
      deviceVendor,
      deviceModel,
      deviceType,
    };
  }

  /**
   * Set the device attribute of this Auth instance
   * @param ip Client IP address string (e.g. req.clientIp)
   * @param userAgent User-Agent header contents
   * @returns The found device
   */
  public async findOrCreate(
    ip: string | undefined,
    userAgent: string | undefined
  ) {
    // IP Address
    // const ip = req.clientIp;
    const { ipv4, ipv6 } = this.parseIp(ip);
    // User Agent
    // const uaText = req.header('User-Agent') || '';
    const {
      uaText,
      uaHash,
      browser,
      os,
      deviceVendor,
      deviceModel,
      deviceType,
    } = this.parseUserAgent(userAgent);

    // User Agent
    const [ua] = await services.db.run(() =>
      UserAgent.findOrCreate({
        where: { uaHash },
        defaults: {
          uaText,
          uaHash,
          browser,
          os,
          deviceVendor,
          deviceModel,
          deviceType,
        },
      })
    );

    // Device
    const [device] = await services.db.run(() =>
      Device.findOrCreate({
        where: {
          ipv4,
          ipv6,
          userAgentId: ua.id,
        },
        defaults: {
          ipv4,
          ipv6,
          userAgentId: ua.id,
        },
      })
    );

    this.model = device;
    return device;
  }
}
