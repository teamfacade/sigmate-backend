import RequestService from '../services/RequestService';

declare global {
  namespace Express {
    export interface Request {
      service: RequestService;
    }
  }
}
