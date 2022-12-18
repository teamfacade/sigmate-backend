import { RequestHandler } from 'express';
import tokenController from './token';
import googleControllers from './google';
import metamaskControllers from './metamask';

const authController: Record<string, Record<string, RequestHandler>> = {
  token: tokenController,
  google: googleControllers,
  metamask: metamaskControllers,
};

export default authController;
