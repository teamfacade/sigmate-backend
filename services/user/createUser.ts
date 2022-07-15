import User, { UserCreationAttributes } from '../../models/User';
import { v4 as uuidv4 } from 'uuid';
import { Credentials } from 'google-auth-library';

import UserProfile, {
  UserProfileCreationAttributes,
} from '../../models/UserProfile';
import db from '../../models';
import UserAuth, { UserAuthCreationAttributes } from '../../models/UserAuth';
import { GoogleProfile } from '../auth/google';
import DatabaseError from '../../utilities/DatabaseError';
import { BaseError } from 'sequelize';

const NEW_USER_GROUP = 'newbie';

export type UserDTOType = Omit<UserCreationAttributes, 'userId' | 'groupId'>;
export type UserAuthDTOType = Omit<UserAuthCreationAttributes, 'userId'>;
export type UserProfileDTOType = Omit<
  UserProfileCreationAttributes,
  'profileId' | 'userId' | 'isDefaultProfile'
>;
/**
 * Creates a new user in the database
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
      const newUser = await User.create(
        {
          userId,
          groupId: NEW_USER_GROUP,
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

      await UserProfile.create(
        {
          userId,
          isDefaultProfile: true,
          ...userProfileDTO,
        },
        { transaction }
      );

      return newUser;
    });
    return createdUser;
  } catch (err) {
    const error = new DatabaseError(err as BaseError);
    throw error;
  }
};

export const createUserGoogle = async (
  googleTokens: Credentials,
  googleProfile: GoogleProfile
) => {
  const userDTO: UserDTOType = {
    userName: googleProfile.displayName,
    email: googleProfile.email,
    googleProfileId: googleProfile.id,
    locale: googleProfile.locale,
  };

  for (const key in userDTO) {
    const k = key as keyof UserDTOType;
    if (!userDTO[k]) delete userDTO[k];
  }

  const userAuthDTO: UserAuthDTOType = {
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
