import { NextFunction, Request, Response } from 'express';
import isIP from 'validator/lib/isIP';
import { Address4, Address6 } from 'ip-address';
import { UserDeviceAttributes } from '../models/UserDevice';
import {
  findOrCreateUserAgent,
  findOrCreateUserDevice,
} from '../services/database/device';
import ApiError from '../utils/errors/ApiError';
import { isDBSyncing } from '../loaders/syncDatabase';

const getUserDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (isDBSyncing) {
    res.status(503).send();
    return;
  }

  try {
    // Get IP address from request
    const clientIp = req.clientIp;
    const userDeviceDTO: Partial<UserDeviceAttributes> = {};
    if (!clientIp) throw new ApiError('ERR_IP_UNDEFINED');

    // Initialize Address instances
    let addr4: Address4 | undefined = undefined;
    let addr6: Address6 | undefined = undefined;
    try {
      if (isIP(clientIp, 4)) {
        addr4 = new Address4(clientIp);
        // address = new Address4(clientIp);
        // ipv4 = address.addressMinusSuffix || address.address;
      } else if (isIP(clientIp, 6)) {
        addr6 = new Address6(clientIp);
        if (addr6.v4) addr4 = addr6.address4;
      } else {
        throw new ApiError('ERR_IP_UNINIT');
      }
    } catch (error) {
      throw new ApiError('ERR_IP_PARSE');
    }

    // Set the DTO with obtained addresses
    if (addr4) {
      userDeviceDTO.ipv4 = addr4.addressMinusSuffix || addr4.address;
    }
    if (addr6) {
      userDeviceDTO.ipv6 = addr6.addressMinusSuffix || addr6.address;
    }

    // Get User-Agent header
    const uaText = req.header('User-Agent') || '';

    // Find or create entries in database
    const [userAgent] = await findOrCreateUserAgent({ uaText });
    userDeviceDTO.userAgentId = userAgent.id;
    const [userDevice] = await findOrCreateUserDevice(userDeviceDTO);
    req.device = userDevice;

    next();
  } catch (error) {
    next(error);
  }
};

export default getUserDevice;
