import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import User from '../../models/User';
import {
  renewAccessToken,
  renewRefreshToken,
  renewTokens,
  voidAccessToken,
  voidRefreshToken,
} from '../database/auth';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import db from '../../models';
import SequelizeError from '../../utils/errors/SequelizeError';
import { getECPublicKey, JWT_ALG, JWT_ISS } from './token';

export type AuthResponse = {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
};

export const sigmateLogin = async (user: User | null | undefined) => {
  // Check user object
  if (!user) throw new UnauthenticatedError();
  const userAuth = user.userAuth || (await user.$get('userAuth'));
  if (!userAuth) throw new UnauthenticatedError();

  // Check if tokens need renewing
  const accessToken = userAuth.sigmateAccessToken || '';
  const refreshToken = userAuth.sigmateRefreshToken || '';
  let shouldRenewAccessToken = false;
  try {
    jwt.verify(accessToken, getECPublicKey(), {
      issuer: JWT_ISS,
      algorithms: [JWT_ALG],
    });
  } catch (tokenError) {
    shouldRenewAccessToken = true;
  }
  let shouldRenewRefreshToken = false;
  try {
    jwt.verify(refreshToken, getECPublicKey(), {
      issuer: JWT_ISS,
      algorithms: [JWT_ALG],
    });
  } catch (tokenError) {
    shouldRenewRefreshToken = true;
  }

  // Update DB
  try {
    await db.sequelize.transaction(async (transaction) => {
      await Promise.all([
        // Update last logged in time
        user.update({ lastLoginAt: new Date() }, { transaction }),
        // Renew tokens
        renewTokens(user, {
          accessToken: shouldRenewAccessToken,
          refreshToken: shouldRenewRefreshToken,
          transaction,
        }),
      ]);
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const renewAccessTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = await renewAccessToken(req.user);
    const response: AuthResponse = { success: true, accessToken };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const renewRefreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      sigmateAccessToken: accessToken,
      sigmateRefreshToken: refreshToken,
    } = await renewRefreshToken(req.user);
    const response: AuthResponse = { success: true, accessToken, refreshToken };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await voidAccessToken(req.user);
    res.status(204);
  } catch (error) {
    next(error);
  }
};

export const logoutAllController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await voidRefreshToken(req.user);
    res.status(204);
  } catch (error) {
    next(error);
  }
};
