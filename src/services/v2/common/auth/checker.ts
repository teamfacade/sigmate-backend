import { Model } from 'sequelize-typescript';
import AuthEngine from '.';
import AuthError from '../errors/request/AuthError';

export type RequireOptions = {
  login?: boolean;
  admin?: boolean;
};

type AuthCheckOptions = {
  engine: AuthEngine;
  invert?: boolean;
  subject?: Model | null;
  throw?: boolean;
  require?: RequireOptions;
};

export default class AuthChecker {
  invert = false;
  throw = true;
  action = '';
  engine: AuthEngine;
  subject?: Model;
  target?: Model;
  source?: Model;
  requireLogin = false;
  requireAdmin = false;

  constructor(options: AuthCheckOptions) {
    this.engine = options.engine;
    this.invert = options.invert || false;
    this.throw = options.throw || false;
  }

  public require(options: RequireOptions) {
    this.requireLogin = options.login || false;
    this.requireAdmin = options.admin || false;
  }

  public can() {
    this.invert = false;
    return this;
  }

  public cannot() {
    this.invert = true;
    return this;
  }

  // specify action
  public do(action: string) {
    this.action = action;
    return this; // For chaining
  }

  public to(target: Model) {
    this.target = target;
    return this;
  }

  public from(source: Model) {
    this.source = source;
    return this;
  }

  public authorize() {
    if (this.requireLogin && !this.engine.user) {
      throw new AuthError();
    }

    if (this.requireAdmin && !this.engine.user?.isAdmin) {
      throw new AuthError();
    }
  }
}
