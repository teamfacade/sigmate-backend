import { RequestHandler } from 'express';
import UAParser from 'ua-parser-js';
import { Address4, Address6 } from 'ip-address';
import { lookup as lookupIp } from 'geoip-lite';
import { detectKBrowsers } from '../utils/device';

export default class HeaderMiddleware {
  static parseDevice(options: { detect?: boolean } = {}): RequestHandler {
    const { detect } = options;
    return (req, res, next) => {
      const uaText = req.header('user-agent');
      if (uaText && detect) {
        req.device = UAParser(uaText);
        req.device = detectKBrowsers(req.device);
      }
      next();
    };
  }

  static parseLocation(options: { geo?: boolean } = {}): RequestHandler {
    const { geo } = options;
    return (req, res, next) => {
      const ip = req.clientIp;
      req.location = {};
      let a4: Address4 | undefined = undefined;
      let a6: Address6 | undefined = undefined;

      if (ip) {
        try {
          a4 = new Address4(ip);
        } catch (error) {
          req.location.ipv4 = undefined;
          req.location.ipv4Int = undefined;
        }

        try {
          a6 = new Address6(ip);
          if (a6.v4) a4 = a6.to4();
        } catch (error) {
          req.location.ipv6 = undefined;
        }

        if (a4) {
          req.location.ipv4 = a4.addressMinusSuffix || a4.address;
          req.location.ipv4Int = Number.parseInt(a4.bigInteger());
        } else if (a6) {
          req.location.ipv6 = a6.addressMinusSuffix || a6.address;
        }

        if (geo) {
          req.location.geo = lookupIp(ip) || undefined;
        }
      }
      next();
    };
  }
}
