import { Credentials } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { BaseError } from 'sequelize';
import db from '../../models';
import User, {
  UserCreationDTO,
  UserDTO,
  UserIdType,
  UserModelAttributes,
} from '../../models/User';
import { UserAuthDTO } from '../../models/UserAuth';
import UserProfile, { UserProfileDTO } from '../../models/UserProfile';
import getErrorFromSequelizeError from '../../utils/getErrorFromSequelizeError';
import { GoogleProfile } from '../auth/google';
import { createUserAuth } from './auth';
import ApiError from '../../utils/errors/ApiError';
import NotFoundError from '../../utils/errors/NotFoundError';

const USERGROUP_NEWBIE = 'newbie';

/**
 * Find a user by id
 * @param userId Id of user
 * @returns User
 * @throws NotFoundError if user is not found
 */
export const findUserById = async (userId: UserIdType) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError();
    return user;
  } catch (error) {
    if (error instanceof BaseError) throw getErrorFromSequelizeError(error);
    throw error;
  }
};

/**
 * Find a user with Google ID
 * @param googleAccountId Google ID
 * @param includeSoftDeleted Include soft-deleted user records in the query result
 * @returns User. null if not found
 * @throws ApiError from Sequelize BaseError
 */
export const findUserByGoogleId = async (
  googleAccountId: UserModelAttributes['googleAccountId'],
  includeSoftDeleted = false
) => {
  try {
    return await User.findOne({
      where: { googleAccountId },
      include: UserProfile,
      paranoid: !includeSoftDeleted,
    });
  } catch (error) {
    throw getErrorFromSequelizeError(error as BaseError);
  }
};

/**
 * Update the last loggged in time of the User record
 * @param userId Id of the user
 * @returns Number of affected row from the DB (1 on success)
 */
export const updateLastLoggedIn = async (userId: UserIdType) => {
  try {
    return await db.sequelize.transaction(async (transaction) => {
      const [affectedCount] = await User.update(
        { lastLoginAt: new Date() },
        { where: { userId }, transaction }
      );
      if (affectedCount !== 1) throw new NotFoundError();
      return affectedCount;
    });
  } catch (error) {
    throw getErrorFromSequelizeError(error as BaseError);
  }
};

/**
 * Creates a new user
 * @param userDTO Properties for the User model
 * @param userAuthDTO Properties for the UserAuth model
 * @param userProfileDTO Properties for the UserProfile model
 * @returns Created user
 */
export const createUser = async (
  userDTO: UserCreationDTO,
  userAuthDTO: UserAuthDTO,
  userProfileDTO: UserProfileDTO
) => {
  const userId = uuidv4();

  try {
    const createdUser = await db.sequelize.transaction(async (transaction) => {
      await User.create(
        {
          userId,
          userName: userDTO.userName || userId,
          group: USERGROUP_NEWBIE,
          ...userDTO,
        },
        { transaction }
      );

      const profile = await UserProfile.create(
        {
          userId,
          isPrimary: true,
          ...userProfileDTO,
        },
        { transaction }
      );

      await User.update(
        { primaryProfile: profile.profileId },
        { where: { userId }, transaction }
      );

      return await User.findOne({
        where: { userId },
        include: UserProfile,
        transaction,
      });
    });
    if (!createdUser) throw new ApiError('ERR_DB');

    const auth = await createUserAuth({
      userId: createdUser.userId,
      ...userAuthDTO,
    });
    if (!auth) throw new ApiError('ERR_DB');

    return createdUser;
  } catch (error) {
    if (error instanceof BaseError) throw getErrorFromSequelizeError(error);
    throw error;
  }
};

/**
 * Creates a new user from a Google profile
 * @param googleTokens Google Credentials object containing Google tokens
 * @param googleProfile Google Profile object from function getGoogleProfile
 * @returns User
 */
export const createUserGoogle = async (
  googleTokens: Credentials,
  googleProfile: GoogleProfile
) => {
  const userDTO: UserCreationDTO = {
    email: googleProfile.email,
    emailVerified: true,
    googleAccountId: googleProfile.id,
    locale: googleProfile.locale,
  };

  const userAuthDTO: UserAuthDTO = {};
  if (googleTokens.access_token)
    userAuthDTO.googleAccessToken = googleTokens.access_token;
  if (googleTokens.refresh_token)
    userAuthDTO.googleRefreshToken = googleTokens.refresh_token;

  const userProfileDTO: UserProfileDTO = {
    displayName: googleProfile.displayName,
    picture: googleProfile.coverPhoto,
    googleAccount: googleProfile.email,
    googleAccountId: googleProfile.id,
  };

  return await createUser(userDTO, userAuthDTO, userProfileDTO);
};

/**
 * Update the one user entry with the given data.
 * Transaction fails when more than one user is updated.
 * @param userDTO Properties for User (userId required)
 * @returns Number of affected rows in the DB
 */
export const updateUser = async (userDTO: UserDTO) => {
  try {
    const affectedCount = await db.sequelize.transaction(
      async (transaction) => {
        const [affectedCount] = await User.update(
          { ...userDTO },
          { where: { userId: userDTO.userId }, transaction }
        );

        if (affectedCount !== 1) throw new NotFoundError();
        return affectedCount;
      }
    );
    return affectedCount;
  } catch (error) {
    if (error instanceof BaseError) throw getErrorFromSequelizeError(error);
    throw error;
  }
};

/**
 * Delete(soft) the user with the given user Id
 * Sequelize keeps the user record in the database but updates the deletedAt field value, to mark as "deleted".
 * @param userId Id of the user
 * @returns Number of affected rows in the DB (1 if successful)
 */
export const deleteUser = async (userId: UserIdType) => {
  try {
    return await db.sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(userId, { transaction });

      if (user) {
        // Deal with all unique columns before soft deleting
        const d = new Date().getTime();

        const userName = `${user.userName}-d${d}`;
        const email = `${user.email || ''}-d${d}`;
        const googleAccountId = `${user.googleAccountId || ''}-d${d}`;

        await user.update(
          {
            userName,
            email,
            googleAccountId,
          },
          { transaction }
        );

        await user.destroy({ transaction });
      } else {
        throw new NotFoundError();
      }
    });
  } catch (error) {
    if (error instanceof BaseError) throw getErrorFromSequelizeError(error);
    throw error;
  }
};
