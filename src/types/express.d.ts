import { RequestMetadata } from '../middlewares/request';
import { User } from '../models/User.model';
import ClientDevice from '../utils/device';

declare global {
  namespace Express {
    interface Request {
      meta: RequestMetadata;
      pg?: sigmate.ReqPg;
      user?: User;
      device?: ClientDevice;
      getLogUser?: () => sigmate.Log.Info['user'];
      getLogDevice?: () => sigmate.Log.Info['device'];
      filename?: string;
      filenames?: string[];
    }

    interface Response {
      body?: any;
      error?: sigmate.ResErr;
      meta: (count?: number) => sigmate.ResMeta;
    }
  }
}
