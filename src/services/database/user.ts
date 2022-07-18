import { Credentials } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { BaseError } from 'sequelize';
import db from '../../models';
import User, { UserCreationDTO, UserModelAttributes } from '../../models/User';
import { UserAuthDTO } from '../../models/UserAuth';
import UserProfile, { UserProfileDTO } from '../../models/UserProfile';
import getErrorFromSequelizeError from '../../utils/getErrorFromSequelizeError';
import { GoogleProfile } from '../auth/google';
import { createUserAuth } from './auth';
import ApiError from '../../utils/errors/ApiError';

const USERGROUP_NEWBIE = 'newbie';

/**
 * Find a user with Google ID
 * @param googleAccountId Google ID
 * @returns User. null if not found
 * @throws ApiError from Sequelize BaseError
 */
export const findUserByGoogleId = async (
  googleAccountId: UserModelAttributes['googleAccountId']
) => {
  try {
    return await User.findOne({
      where: { googleAccountId },
      include: UserProfile,
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
