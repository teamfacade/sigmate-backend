import User, { UserCreationAttributes } from '../../models/User';
import { v4 as uuidv4 } from 'uuid';
import { Credentials } from 'google-auth-library';
import { BaseError } from 'sequelize';

import UserProfile, {
  UserProfileCreationAttributes,
} from '../../models/UserProfile';
import db from '../../models';
import UserAuth, { UserAuthCreationAttributes } from '../../models/UserAuth';
import { GoogleProfile } from '../auth/google';
import DatabaseError from '../../utilities/errors/DatabaseError';

const NEW_USER_GROUP = 'newbie';

export type UserDTOType = Omit<UserCreationAttributes, 'userId' | 'group'>;
export type UserAuthDTOType = Omit<UserAuthCreationAttributes, 'userId'>;
export type UserProfileDTOType = Omit<
  UserProfileCreationAttributes,
  'profileId' | 'userId' | 'isPrimary'
>;

/**
 * Creates a new user
 * @param userDTO Properties for the User model
 * @param userAuthDTO Properties for the UserAuth model
 * @param userProfileDTO Properties for the UserProfile model
 * @returns Created user
 */
const createUser = async (
  userDTO: UserDTOType,
  userAuthDTO: UserAuthDTOType = {},
  userProfileDTO: UserProfileDTOType = {}
) => {
  const userId = uuidv4();
  if (!userDTO.userName) userDTO.userName = userId;
  try {
    const createdUser = await db.sequelize.transaction(async (transaction) => {
      const user = await User.create(
        {
          userId,
          group: NEW_USER_GROUP,
          ...userDTO,
        },
        { transaction }
      );

      await UserAuth.create(
        {
          userId,
          ...userAuthDTO,
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

      return user;
    });
    return createdUser;
  } catch (err) {
    const error = new DatabaseError(err as BaseError);
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
  const userDTO: UserDTOType = {
    userName: googleProfile.displayName,
    email: googleProfile.email,
    emailVerified: true,
    googleProfileId: googleProfile.id,
    locale: googleProfile.locale,
  };

  for (const key in userDTO) {
    const k = key as keyof UserDTOType;
    if (!userDTO[k]) delete userDTO[k];
  }

  const userAuthDTO: UserAuthDTOType = {
    googleAccessToken: googleTokens.access_token || '',
    googleRefreshToken: googleTokens.refresh_token || '',
  };

  if (!googleTokens.refresh_token) {
    delete userAuthDTO.googleRefreshToken;
  }

  const userProfileDTO: UserProfileDTOType = {
    profilePictureSrc: googleProfile.coverPhoto,
    displayName: googleProfile.displayName,
  };

  return await createUser(userDTO, userAuthDTO, userProfileDTO);
};

export default createUser;
