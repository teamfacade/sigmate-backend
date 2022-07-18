import { NextFunction, Request, Response } from 'express';
import BadRequestError from '../utils/errors/BadRequestError';
import ForbiddenError from '../utils/errors/ForbiddenError';
import UnauthenticatedError from '../utils/errors/UnauthenticatedError';

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    next(new UnauthenticatedError());
  }
};

export const isNotAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    next(new BadRequestError({}, 'ERR_AUTHENTICATED'));
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    if (req.user.isAdmin) {
      next();
    } else {
      next(new ForbiddenError('ERR_NOT_ADMIN'));
    }
  } else {
    next(new UnauthenticatedError());
  }
};

export const isMyselfParams = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
    const { userId } = req.params;
    if (userId === req.user.userId) {
      next();
    } else {
      next(new ForbiddenError());
    }
  } else {
    next(new UnauthenticatedError());
  }
};

export const isMyselfBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.body;
  if (req.isAuthenticated()) {
    if (userId == req.user.userId) {
      next();
    } else {
      next(new ForbiddenError());
    }
  } else {
    next(new UnauthenticatedError());
  }
};
