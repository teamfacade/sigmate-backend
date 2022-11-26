import RequestService from '../services/common/RequestService';

declare global {
  namespace Express {
    export interface Request {
      service: RequestService;
    }
  }
}
