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
import { getECPublicKey, JWT_ALG, JWT_ISS, SigmateJwtPayload } from './token';

export type AuthResponse = {
  success: boolean;
  user?: any;
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
    if (accessToken) {
      const payload = jwt.verify(accessToken, getECPublicKey(), {
        issuer: JWT_ISS,
        algorithms: [JWT_ALG],
      }) as SigmateJwtPayload;
      if (
        payload.group !== user.group.id ||
        (payload.isAdmin as unknown as boolean | undefined) !== user.isAdmin
      ) {
        shouldRenewAccessToken = true;
      }
    } else {
      shouldRenewAccessToken = true;
    }
  } catch (tokenError) {
    shouldRenewAccessToken = true;
  }
  let shouldRenewRefreshToken = false;
  try {
    if (refreshToken) {
      const payload = jwt.verify(refreshToken, getECPublicKey(), {
        issuer: JWT_ISS,
        algorithms: [JWT_ALG],
      }) as SigmateJwtPayload;

      if (
        payload.group !== user.group.id ||
        (payload.isAdmin as unknown as boolean | undefined) !== user.isAdmin
      ) {
        shouldRenewRefreshToken = true;
      }
    } else {
      shouldRenewRefreshToken = true;
    }
  } catch (tokenError) {
    shouldRenewRefreshToken = true;
  }

  // Update DB
  try {
    return await db.sequelize.transaction(async (transaction) => {
      // Update last logged in time
      await user.update({ lastLoginAt: new Date() }, { transaction });
      // Renew tokens
      return await renewTokens(user, {
        accessToken: shouldRenewAccessToken,
        refreshToken: shouldRenewRefreshToken,
        transaction,
      });
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
    res.status(204).send();
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
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
