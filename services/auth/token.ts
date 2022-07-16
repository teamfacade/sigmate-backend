import jwt from 'jsonwebtoken';
import fs from 'fs';
import User from '../../models/User';
import UserAuth from '../../models/UserAuth';
import db from '../../models';
import DatabaseError from '../../utilities/errors/DatabaseError';
import { BaseError } from 'sequelize';
import ApiError from '../../utilities/errors/ApiError';
import UserGroup from '../../models/UserGroup';

export const JWT_ALG = 'ES256';
export const JWT_ISS = 'sigmate.io';
export const JWT_EXP_ACCESS = '1h';
export const JWT_EXP_REFRESH = '30d';
export const JWT_TYP_ACCESS = 'acc';
export const JWT_TYP_REFRESH = 'ref';

const getECPrivateKey = () => {
  return fs.readFileSync('keys/private-key.pem');
};

export const getECPublicKey = () => {
  return fs.readFileSync('keys/cert.pem');
};

interface SigmateJwtPayload extends jwt.JwtPayload {
  typ?: string;
  group?: string;
  isAdmin?: boolean;
}

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
    typ?: string;
    group?: string;
    userId?: string;
    isAdmin?: boolean;
  } = {};

  try {
    const decodedToken = jwt.verify(accessToken, getECPublicKey(), {
      issuer: JWT_ISS,
      algorithms: [JWT_ALG],
    }) as SigmateJwtPayload;

    tokenData.typ = decodedToken.typ;
    tokenData.group = decodedToken.group;
    tokenData.userId = decodedToken.sub;
    tokenData.isAdmin = decodedToken.isAdmin;
  } catch (tokenError) {
    // Token is invalid
    return null;
  }

  const { typ, group, userId, isAdmin } = tokenData;

  if (!group || !userId || !isAdmin) {
    // required information missing
    return null;
  }

  if (typ !== JWT_TYP_ACCESS) {
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
    typ?: string;
    group?: string;
    userId?: string;
    isAdmin?: boolean;
  } = {};

  try {
    const decodedToken = jwt.verify(refreshToken, getECPublicKey(), {
      issuer: JWT_ISS,
      algorithms: [JWT_ALG],
    }) as SigmateJwtPayload;

    tokenData.typ = decodedToken.typ;
    tokenData.group = decodedToken.group;
    tokenData.userId = decodedToken.sub;
    tokenData.isAdmin = decodedToken.isAdmin;
  } catch (tokenError) {
    // Token is invalid
    return null;
  }

  const { typ, group, userId, isAdmin } = tokenData;

  if (!group || !userId || !isAdmin) {
    // required information missing
    return null;
  }

  if (typ !== JWT_TYP_REFRESH) {
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

/**
 * Generates a new Sigmate access token
 * @param userId Id of the user
 * @param group Group of the user
 * @param isAdmin Whether user is an admin
 * @returns New access token (JWT)
 */
export const createAccessToken = (
  userId: string,
  group: string,
  isAdmin: boolean
) => {
  return jwt.sign({ typ: JWT_TYP_ACCESS, group, isAdmin }, getECPrivateKey(), {
    issuer: JWT_ISS,
    algorithm: JWT_ALG,
    subject: userId,
    expiresIn: JWT_EXP_ACCESS,
  });
};

/**
 * Generates a new Sigmate refresh token
 * @param userId Id of the user
 * @param group Group of the user
 * @param isAdmin Whether user is an admin
 * @returns New refresh token
 */
export const createRefreshToken = (
  userId: string,
  group: string,
  isAdmin: boolean
) => {
  return jwt.sign({ typ: JWT_TYP_REFRESH, group, isAdmin }, getECPrivateKey(), {
    issuer: JWT_ISS,
    algorithm: JWT_ALG,
    subject: userId,
    expiresIn: JWT_EXP_ACCESS,
  });
};

/**
 * Generate a new Sigmate access token, and update the user auth DB
 * @param userId Id of the user
 * @param group Group of the user
 * @param isAdmin Whether user is an admin
 * @returns New access token, if everything was successful
 * @throws DatabaseError
 */
export const renewAccessToken = async (
  userId: string,
  group: string,
  isAdmin: boolean
): Promise<string | null> => {
  const token = createAccessToken(userId, group, isAdmin);
  try {
    const [affectedCount] = await db.sequelize.transaction(
      async (transaction) => {
        return await UserAuth.update(
          { sigmateAccessToken: token },
          { where: { userId }, transaction }
        );
      }
    );
    if (affectedCount === 0) return null;
    return token;
  } catch (error) {
    throw new DatabaseError(error as BaseError);
  }
};

/**
 * Generates a new Sigmate refresh token, and update the user auth DB
 * @param userId Id of the user
 * @param group Group of the user
 * @param isAdmin Whether user is an admin
 * @returns New refresh token, if everything was successful
 * @throws DatabaseError
 */
export const renewRefreshToken = async (
  userId: string,
  group: string,
  isAdmin: boolean
): Promise<string | null> => {
  const token = createRefreshToken(userId, group, isAdmin);
  try {
    const [affectedCount] = await db.sequelize.transaction(
      async (transaction) => {
        return await UserAuth.update(
          { sigmateAccessToken: token },
          { where: { userId }, transaction }
        );
      }
    );
    if (affectedCount === 0) return null;
    return token;
  } catch (error) {
    throw new DatabaseError(error as BaseError);
  }
};

/**
 * Get Sigmate access and refresh tokens from the DB
 * @param userId Id of the user
 * @param group Group of the user
 * @param isAdmin Whether user is an admin
 * @param renew Re-issue any invalidated tokens
 * @returns Sigmate access and refresh token of the given user
 */
export const retrieveTokens = async (
  userId: string,
  group: string,
  isAdmin: boolean,
  renew = true
) => {
  // Look for User in DB
  const dbData: { auth: UserAuth | null } = { auth: null };
  try {
    dbData.auth = await UserAuth.findByPk(userId);
  } catch (error) {
    throw new DatabaseError(error as BaseError);
  }

  // Prepare return value
  const tokens = { accessToken: '', refreshToken: '' };
  const { auth } = dbData;

  if (!auth) {
    throw new ApiError('ERR_USER_NOT_FOUND');
  }

  // If there is no need to renew, just return the retrieved tokens
  // from the DB as-is.
  if (!renew) {
    tokens.accessToken = auth?.sigmateAccessToken || '';
    tokens.refreshToken = auth?.sigmateRefreshToken || '';
    return tokens;
  }

  // Check if access token in DB is valid
  try {
    if (auth?.sigmateAccessToken) {
      const decodedToken = jwt.verify(
        auth.sigmateAccessToken,
        getECPublicKey(),
        {
          issuer: JWT_ISS,
          subject: userId,
          algorithms: [JWT_ALG],
        }
      ) as SigmateJwtPayload;

      if (
        decodedToken.group === group &&
        decodedToken.isAdmin === isAdmin &&
        decodedToken.typ === JWT_TYP_ACCESS
      ) {
        tokens.accessToken = auth.sigmateAccessToken;
      }
    }
  } catch (error) {
    tokens.accessToken = '';
  }

  // Check if refresh token in DB is valid
  try {
    if (auth?.sigmateRefreshToken) {
      const decodedToken = jwt.verify(
        auth.sigmateRefreshToken,
        getECPublicKey(),
        {
          issuer: JWT_ISS,
          subject: userId,
          algorithms: [JWT_ALG],
        }
      ) as SigmateJwtPayload;

      if (
        decodedToken.group === group &&
        decodedToken.isAdmin === isAdmin &&
        decodedToken.typ === JWT_TYP_REFRESH
      ) {
        tokens.refreshToken = auth.sigmateRefreshToken;
      }
    }
  } catch (error) {
    tokens.refreshToken = '';
  }

  // Renew token(s) if needed
  if (!tokens.accessToken)
    tokens.accessToken = (await renewAccessToken(userId, group, isAdmin)) || '';

  if (!tokens.refreshToken)
    tokens.refreshToken =
      (await renewRefreshToken(userId, group, isAdmin)) || '';

  // If token renew failed for some reason, throw an error
  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new ApiError('ERR_TOKEN_RENEW');
  }

  // Finally, return the tokens
  return tokens;
};
