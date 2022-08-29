import UserModel from '../models/User';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface User extends UserModel {}

    export interface Request {
      pg?: {
        // pagination
        limit: number;
        page: number;
        offset: number;
      };
    }
  }
}
