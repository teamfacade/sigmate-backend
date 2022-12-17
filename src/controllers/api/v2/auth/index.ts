import { RequestHandler } from 'express';
import tokenController from './token';
import googleControllers from './google';

const authController: Record<string, Record<string, RequestHandler>> = {
  token: tokenController,
  google: googleControllers,
};

export default authController;
