import { Credentials } from 'google-auth-library';
import { BaseError } from 'sequelize';
import { UserIdType } from '../../models/User';
import UserAuth, { UserAuthCreationDTO } from '../../models/UserAuth';
import NotFoundError from '../../utils/errors/NotFoundError';
import getErrorFromSequelizeError from '../../utils/getErrorFromSequelizeError';
import db from '../../models';

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
