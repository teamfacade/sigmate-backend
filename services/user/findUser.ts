import { BaseError } from 'sequelize';
import jwt from 'jsonwebtoken';
import User, {
  UserIdType,
  UserInstanceAttributes,
} from '../../models/user/User';
import UserProfile from '../../models/user/UserProfile';
import UserGroup from '../../models/user/UserGroup';
import UserAuth from '../../models/user/UserAuth';
import DatabaseError from '../../utilities/errors/DatabaseError';
import {
  getECPublicKey,
  SigmateJwtPayload,
  JWT_ALG,
  JWT_ISS,
  JWT_TYP_ACCESS,
  JWT_TYP_REFRESH,
} from '../auth/token';

/**
 * Find a user with the ID
 * @param userId
 * @returns User with the given user ID
 * @throws DatabaseError if user is not found
 */
export const findUserById = async (userId: UserIdType) => {
  try {
    return await User.findByPk(userId, { include: UserProfile });
  } catch (error) {
    throw new DatabaseError(error as BaseError);
  }
};

/**
 * Find a user with username
 * @param userName
 * @returns User
 * @throws DatabaseError if user is not found
 */
export const findUserByUserName = async (
  userName: UserInstanceAttributes['userName']
) => {
  try {
    return await User.findOne({ where: { userName }, include: UserProfile });
  } catch (error) {
    throw new DatabaseError(error as BaseError);
  }
};

/**
 * Find a user with Google ID
 * @param googleProfileId Google ID
 * @returns User
 * @throws DatabaseError if user is not found
 */
export const findUserByGoogleId = async (
  googleProfileId: UserInstanceAttributes['googleProfileId']
) => {
  try {
    return await User.findOne({
      where: { googleProfileId },
      include: UserProfile,
    });
  } catch (error) {
    throw new DatabaseError(error as BaseError);
  }
};

/**
 * Look for a user with a given Sigmate access token
 * @param accessToken Sigmate access token
 * @returns User if token is valid and matches. Returns null otherwise.
 * @throws DatabaseError
 */
export const findUserByAccessToken = async (
  accessToken: string | null
): Promise<User | null> => {
  // No need to bother if accessToken is falsy
  if (!accessToken) return null;

  // Decode jwt
  const tokenData: {
    tok?: string;
    group?: string;
    userId?: string;
    isAdmin?: boolean;
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
    // Token is invalid
    return null;
  }

  const { tok, group, userId, isAdmin } = tokenData;

  if (!group || !userId || !isAdmin) {
    // required information missing
    return null;
  }

  if (tok !== JWT_TYP_ACCESS) {
    // wrong type
    return null;
  }

  // Compare with DB
  const dbData: {
    sigmateAccessToken: string;
    user: User | null;
  } = { sigmateAccessToken: '', user: null };
  try {
    const user = await User.findOne({
      where: {
        userId: tokenData.userId,
        group: tokenData.group,
        isAdmin: tokenData.isAdmin,
      },
      include: UserGroup,
    });
    if (!user) return null; // User not found
    dbData.user = user;
    const auth = await UserAuth.findOne({ where: { userId } });
    if (!auth) return null; // UserAuth not found
    if (auth.sigmateAccessToken) {
      dbData.sigmateAccessToken = auth.sigmateAccessToken;
    } else {
      return null; // No access token
    }
  } catch (dbError) {
    throw new DatabaseError(dbError as BaseError);
  }

  const { sigmateAccessToken, user } = dbData;
  if (sigmateAccessToken === accessToken) {
    return user;
  }

  return null; // Tokens do not match
};

/**
 * Look for a user with a given Sigmate refresh token
 * @param refreshToken Sigmate refresh token
 * @returns User if token is valid and matches. Returns null otherwise.
 * @throws DatabaseError
 */
export const findUserByRefreshToken = async (
  refreshToken: string | null
): Promise<User | null> => {
  // No need to bother if accessToken is falsy
  if (!refreshToken) return null;

  // Decode jwt
  const tokenData: {
    tok?: string;
    group?: string;
    userId?: string;
    isAdmin?: boolean;
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
    // Token is invalid
    return null;
  }

  const { tok, group, userId, isAdmin } = tokenData;

  if (!group || !userId || !isAdmin) {
    // required information missing
    return null;
  }

  if (tok !== JWT_TYP_REFRESH) {
    // wrong type
    return null;
  }

  // Compare with DB
  const dbData: {
    sigmateRefreshToken: string;
    user: User | null;
  } = { sigmateRefreshToken: '', user: null };
  try {
    const user = await User.findOne({
      where: {
        userId: tokenData.userId,
        group: tokenData.group,
        isAdmin: tokenData.isAdmin,
      },
      include: UserGroup,
    });
    if (!user) return null; // User not found
    dbData.user = user;
    const auth = await UserAuth.findOne({ where: { userId } });
    if (!auth) return null; // UserAuth not found
    if (auth.sigmateRefreshToken) {
      dbData.sigmateRefreshToken = auth.sigmateRefreshToken;
    } else {
      return null; // No refresh token
    }
  } catch (dbError) {
    throw new DatabaseError(dbError as BaseError);
  }

  const { sigmateRefreshToken, user } = dbData;
  if (sigmateRefreshToken === refreshToken) {
    return user;
  }

  return null; // Tokens do not match
};
