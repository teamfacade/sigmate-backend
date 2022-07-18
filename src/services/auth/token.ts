import jwt from 'jsonwebtoken';
import fs from 'fs';
import UserAuth from '../../models/UserAuth';
import { BaseError } from 'sequelize';
import ApiError from '../../utils/errors/ApiError';
import getErrorFromSequelizeError from '../../utils/getErrorFromSequelizeError';
import { UserIdType } from '../../models/User';
import { updateUserAuth } from '../database/auth';

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

export interface SigmateJwtPayload extends jwt.JwtPayload {
  tok?: string;
  group?: string;
  isAdmin?: boolean;
}

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
  return jwt.sign({ tok: JWT_TYP_ACCESS, group, isAdmin }, getECPrivateKey(), {
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
  return jwt.sign({ tok: JWT_TYP_REFRESH, group, isAdmin }, getECPrivateKey(), {
    issuer: JWT_ISS,
    algorithm: JWT_ALG,
    subject: userId,
    expiresIn: JWT_EXP_REFRESH,
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
): Promise<string> => {
  const token = createAccessToken(userId, group, isAdmin);
  await updateUserAuth(userId, { sigmateAccessToken: token });
  return token;
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
): Promise<string> => {
  const token = createRefreshToken(userId, group, isAdmin);
  await updateUserAuth(userId, { sigmateRefreshToken: token });
  return token;
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
    throw getErrorFromSequelizeError(error as BaseError);
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
        decodedToken.tok === JWT_TYP_ACCESS
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
        decodedToken.tok === JWT_TYP_REFRESH
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
    throw new ApiError('ERR_TOK');
  }

  // Finally, return the tokens
  return tokens;
};

export const voidAccessToken = async (userId: UserIdType) => {
  return await updateUserAuth(userId, { sigmateAccessToken: '' });
};

export const voidRefreshToken = async (userId: UserIdType) => {
  return await updateUserAuth(userId, { sigmateRefreshToken: '' });
};

export const voidAllSigmateTokens = async (userId: UserIdType) => {
  return await updateUserAuth(userId, {
    sigmateAccessToken: '',
    sigmateRefreshToken: '',
  });
};