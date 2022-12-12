import { RequestHandler } from 'express';
import tokenController from './token';

const authController: Record<string, RequestHandler> = {
  ...tokenController,
};

export default authController;
