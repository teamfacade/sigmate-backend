import { PaginationOptions } from '../middlewares/handlePagination';
import UserModel from '../models/User';
import UserDevice from '../models/UserDevice';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface User extends UserModel {}

    export interface Request {
      pg?: PaginationOptions;
      device?: UserDevice;
    }
  }
}
