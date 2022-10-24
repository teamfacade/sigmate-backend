import { Request } from 'express';
import User from '../../../../models/User';
import UserDevice from '../../../../models/UserDevice';
import AuthChecker from './checker';

export default class AuthEngine {
  user: User | null | undefined;
  device: UserDevice | null | undefined;

  constructor(req: Request) {
    this.user = req.user;
    this.device = req.device;
  }

  protected get subject() {
    return this.user || this.device;
  }

  public check() {
    return new AuthChecker({ engine: this, subject: this.subject });
  }
}
