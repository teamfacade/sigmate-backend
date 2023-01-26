import RequestUtil from '../utils/RequestUtil';
import UserModel from '../models/user/User.model';
import { Lookup } from 'geoip-lite';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface User extends UserModel {}
    export interface Request {
      /** Store information about request for LoggerService */
      logger?: {
        id: string;
        /** Elapsed time from request util init to response header emit */
        duration: number;
        /** Whether response headers have been emitted */
        headers: boolean;
        endpoint?: string;
        success?: boolean;
        body?: any;
        data?: Record<string, unknown>;
      };
      util?: RequestUtil;
      device?: UAParser.IResult;
      location?: {
        ipv4?: string;
        ipv4Int?: number;
        ipv6?: string;
        geo?: Lookup;
      };
    }
  }
}
