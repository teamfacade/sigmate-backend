import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { findUserByRefreshToken } from '../services/database/auth';
import BadRequestError from '../utils/errors/BadRequestError';
import ForbiddenError from '../utils/errors/ForbiddenError';
import UnauthenticatedError from '../utils/errors/UnauthenticatedError';

export const passportJwtAuth = passport.authenticate('jwt', { session: false });

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
    const userId = req.params.userId ? parseInt(req.params.userId) : undefined;
    if (userId === req.user?.id) {
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
    if (userId === req.user?.id) {
      next();
    } else {
      next(new ForbiddenError());
    }
  } else {
    next(new UnauthenticatedError());
  }
};

export const isRefreshTokenValid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { refreshToken } = req.body;

  const user = await findUserByRefreshToken(refreshToken);

  if (user) {
    req.user = user;
    next(); // refresh token valid
  } else {
    next(new UnauthenticatedError()); // refresh token invalid
  }
};
