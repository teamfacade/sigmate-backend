import RequestService from '../services/Request';
import UserService from '../services/auth/User';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface User extends UserService {}
    export interface Request {
      service: RequestService;
    }
  }
}
