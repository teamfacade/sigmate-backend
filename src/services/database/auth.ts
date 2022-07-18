import { Credentials } from 'google-auth-library';
import { BaseError } from 'sequelize';
import jwt from 'jsonwebtoken';
import User, { UserIdType } from '../../models/User';
import UserAuth, { UserAuthCreationDTO } from '../../models/UserAuth';
import NotFoundError from '../../utils/errors/NotFoundError';
import getErrorFromSequelizeError from '../../utils/getErrorFromSequelizeError';
import db from '../../models';
import {
  getECPublicKey,
  JWT_ALG,
  JWT_ISS,
  JWT_TYP_ACCESS,
  JWT_TYP_REFRESH,
  SigmateJwtPayload,
} from '../auth/token';
import UserGroup from '../../models/UserGroup';

/**
 * Create an empty UserAuth entry in the user_auths table
 * @param userAuthDTO Properties for the UserAuth model
 * @returns Created UserAuth
 */
export const createUserAuth = async (userAuthDTO: UserAuthCreationDTO) => {
  try {
    return await db.sequelize.transaction(async (transaction) => {
      return await UserAuth.create({ ...userAuthDTO }, { transaction });
    });
  } catch (error) {
    throw getErrorFromSequelizeError(error as BaseError);
  }
};

/**
 * Look for a UserAuth entry with the given user ID.
 * @param userId ID of the user
 * @returns UserAuth
 */
export const findUserAuthById = async (userId: UserIdType) => {
  try {
    return await UserAuth.findByPk(userId);
  } catch (error) {
    throw getErrorFromSequelizeError(error as BaseError);
  }
};

/**
 * Update the DB with new Google tokens
 * @param userId Id of the user
 * @param googleTokens Object containing Google's access and/or refresh token
 * @throws NotFoundError if User is not found in the DB, or ApiError (from Sequelize BaseError)
 */
export const updateGoogleTokens = async (
  userId: string,
  googleTokens: Credentials
) => {
  const updateValues: {
    googleAccessToken?: string;
    googleRefreshToken?: string;
  } = {
    googleAccessToken: googleTokens.access_token || '',
    googleRefreshToken: googleTokens.refresh_token || '',
  };

  if (!updateValues.googleAccessToken) delete updateValues.googleAccessToken;

  if (!updateValues.googleRefreshToken) delete updateValues.googleRefreshToken;

  try {
    const [affectedCount] = await UserAuth.update(updateValues, {
      where: { userId },
    });
    if (affectedCount === 0) throw new NotFoundError('ERR_OAUTH_GOOGLE');
  } catch (error) {
    if (error instanceof BaseError) throw getErrorFromSequelizeError(error);
    throw error;
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

  if (group === undefined || userId === undefined || isAdmin === undefined) {
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
    if (!user) {
      return null; // User not found
    }
    dbData.user = user;
    const auth = await UserAuth.findOne({ where: { userId } });
    if (!auth) {
      return null; // UserAuth not found
    }
    if (auth.sigmateAccessToken) {
      dbData.sigmateAccessToken = auth.sigmateAccessToken;
    } else {
      return null; // No access token
    }
  } catch (dbError) {
    throw getErrorFromSequelizeError(dbError as BaseError);
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

  if (group === undefined || userId === undefined || isAdmin === undefined) {
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
    throw getErrorFromSequelizeError(dbError as BaseError);
  }

  const { sigmateRefreshToken, user } = dbData;
  if (sigmateRefreshToken === refreshToken) {
    return user;
  }

  return null; // Tokens do not match
};
