import { NextFunction, Request, Response } from 'express';
import MethodNotAllowedError from '../utils/errors/MethodNotAllowedError';

const methodNotAllowed = (req: Request, res: Response, next: NextFunction) => {
  next(new MethodNotAllowedError());
};

export default methodNotAllowed;
