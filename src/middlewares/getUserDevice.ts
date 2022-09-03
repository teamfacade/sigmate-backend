import { NextFunction, Request, Response } from 'express';
import isIP from 'validator/lib/isIP';
import ApiError from '../utils/errors/ApiError';
import { UserDeviceAttributes } from '../models/UserDevice';
import { ipToInt } from '../utils/ipAddress';
import {
  findOrCreateUserAgent,
  findOrCreateUserDevice,
} from '../services/database/device';

const getUserDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get client's remote IP address
    const ip = req.header('x-forwarded-for') || req.socket.remoteAddress;
    if (!ip) {
      throw new ApiError('ERR_NO_IP');
    }
    const userDeviceDTO: Partial<UserDeviceAttributes> = {};
    if (isIP(ip, 4)) {
      userDeviceDTO.ipv4 = ipToInt(ip);
    } else if (isIP(ip, 6)) {
      userDeviceDTO.ipv6 = ip;
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
