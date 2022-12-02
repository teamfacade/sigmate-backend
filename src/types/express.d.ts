import RequestService from '../services/Request';

declare global {
  namespace Express {
    export interface Request {
      service: RequestService;
    }

    export interface Response {
      service: RequestService;
    }
  }
}
