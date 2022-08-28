import jwt from 'jsonwebtoken';
import { BaseError } from 'sequelize';
import User, { UserAttributes } from '../../models/User';
import UserAuth from '../../models/UserAuth';
import UserGroup from '../../models/UserGroup';
import UserProfile from '../../models/UserProfile';
import SequelizeError from '../../utils/errors/SequelizeError';
import {
  getECPublicKey,
  JWT_ALG,
  JWT_ISS,
  JWT_TYP_ACCESS,
  JWT_TYP_REFRESH,
  SigmateJwtPayload,
} from '../auth/token';

export const findUserByGoogleId = async (
  googleAccountId: UserAttributes['googleAccountId']
) => {
  try {
    return await User.findOne({
      where: { googleAccountId },
      include: [UserGroup, UserProfile, UserAuth],
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const findUserByAccessToken = async (accessToken: string) => {
  // No need to bother if accessToken is falsy
  if (!accessToken) return null;

  // Decode jwt
  const tokenData: {
    tok?: string;
    group?: string;
    userId?: string;
    isAdmin?: string;
  } = {};

  try {
    const decodedToken = jwt.verify(accessToken, getECPublicKey(), {
      issuer: JWT_ISS,
      algorithms: [JWT_ALG],
    }) as SigmateJwtPayload;

    tokenData.tok = decodedToken.tok;
    tokenData.group = decodedToken.group;
    tokenData.userId = decodedToken.sub;
    tokenData.isAdmin = decodedToken.isAdmin;
  } catch (tokenError) {
    // Invalid token
    return null;
  }

  const { tok, group, userId, isAdmin } = tokenData;

  if (group === undefined || userId === undefined || isAdmin === undefined) {
    // required information missing
    return null;
  }

  if (tok !== JWT_TYP_ACCESS) {
    // wrong type of token
    return null;
  }

  // Compare token with DB
  try {
    const user = await User.findOne({
      where: { id: userId, isAdmin },
      include: [UserGroup, UserAuth],
    });

    // User not found
    if (!user) return null;

    // Wrong group name
    if (user?.group.id.toString() !== group) return null;

    // Wrong or expired access token
    if (user.userAuth?.sigmateAccessToken !== accessToken) return null;

    return user;
  } catch (error) {
    throw new SequelizeError(error as BaseError);
  }
};

export const findUserByRefreshToken = async (refreshToken: string) => {
  // No need to bother if accessToken is falsy
  if (!refreshToken) return null;

  // Decode jwt
  const tokenData: {
    tok?: string;
    group?: string;
    userId?: string;
    isAdmin?: string;
  } = {};

  try {
    const decodedToken = jwt.verify(refreshToken, getECPublicKey(), {
      issuer: JWT_ISS,
      algorithms: [JWT_ALG],
    }) as SigmateJwtPayload;

    tokenData.tok = decodedToken.tok;
    tokenData.group = decodedToken.group;
    tokenData.userId = decodedToken.sub;
    tokenData.isAdmin = decodedToken.isAdmin;
  } catch (tokenError) {
    // Invalid token
    return null;
  }

  const { tok, group, userId, isAdmin } = tokenData;

  if (group === undefined || userId === undefined || isAdmin === undefined) {
    // required information missing
    return null;
  }

  if (tok !== JWT_TYP_REFRESH) {
    // wrong type of token
    return null;
  }

  // Compare token with DB
  try {
    const user = await User.findOne({
      where: { id: userId, isAdmin },
      include: [UserGroup, UserAuth],
    });

    // User not found
    if (!user) return null;

    // Wrong group name
    if (user?.group.id.toString() !== group) return null;

    // Wrong or expired access token
    if (user.userAuth?.sigmateRefreshToken !== refreshToken) return null;

    return user;
  } catch (error) {
    throw new SequelizeError(error as BaseError);
  }
};
