import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import BadRequestError from '../utils/errors/BadRequestError';

const BadRequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new BadRequestError({ validationErrors: errors.array() }));
  }
  next();
};

export default BadRequestHandler;
