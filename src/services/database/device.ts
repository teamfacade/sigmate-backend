import crypto from 'crypto';
import UAParser from 'ua-parser-js';
import UserAgent, { UserAgentAttributes } from '../../models/UserAgent';
import UserDevice, { UserDeviceAttributes } from '../../models/UserDevice';
import SequelizeError from '../../utils/errors/SequelizeError';

export const findOrCreateUserAgent = async (
  userAgentDTO: Partial<UserAgentAttributes>
) => {
  if (userAgentDTO.uaText) {
    // Parse User Agent string
    const uaParsed = UAParser(userAgentDTO.uaText);
    userAgentDTO.browser = uaParsed.browser.name || '';
    userAgentDTO.os = uaParsed.os.name || '';
    userAgentDTO.deviceVendor = uaParsed.device.vendor || '';
    userAgentDTO.deviceModel = uaParsed.device.model || '';
    userAgentDTO.deviceType = uaParsed.device.type || '';
  }

  // Generate hash
  if (!userAgentDTO.uaHash) {
    userAgentDTO.uaHash = crypto
      .createHash('md5')
      .update(userAgentDTO.uaText || '')
      .digest('hex');
  }

  try {
    return await UserAgent.findOrCreate({
      where: { uaHash: userAgentDTO.uaHash },
      defaults: {
        ...userAgentDTO,
        uaText: userAgentDTO.uaText || '',
      },
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const findOrCreateUserDevice = async (
  userDeviceDTO: Partial<UserDeviceAttributes>
) => {
  try {
    return await UserDevice.findOrCreate({ where: { ...userDeviceDTO } });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
