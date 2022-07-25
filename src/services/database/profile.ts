import { BaseError } from 'sequelize';
import db from '../../models';
import User, { UserIdType } from '../../models/User';
import UserProfile, {
  UserProfileCreationDTO,
  UserProfileDTO,
} from '../../models/UserProfile';
import ApiError from '../../utils/errors/ApiError';
import NotFoundError from '../../utils/errors/NotFoundError';
import getErrorFromSequelizeError from '../../utils/getErrorFromSequelizeError';
import { findUserById } from './user';

export const findProfileById = async (profileId: number | string) => {
  try {
    if (typeof profileId === 'string') profileId = parseInt(profileId);
    return await UserProfile.findByPk(profileId);
  } catch (error) {
    throw getErrorFromSequelizeError(error as BaseError);
  }
};

export const findProfilesByUserId = async (userId: UserIdType) => {
  try {
    return await UserProfile.findAll({ where: { userId } });
  } catch (error) {
    throw getErrorFromSequelizeError(error as BaseError);
  }
};

/**
 * Create a profile for the specified user
 * @param userId Id of the user
 * @param userProfileDTO Attributes for UserProfile
 * @returns Created UserProfile
 * @throws Database error
 */
export const createProfileForUser = async (
  userId: UserIdType,
  userProfileDTO: UserProfileCreationDTO
) => {
  // overwrite the userId field in the DTO with the ID passed by function argument 'userId'
  userProfileDTO.userId = userId;

  try {
    return await db.sequelize.transaction(async (transaction) => {
      return await UserProfile.create(
        {
          ...userProfileDTO,
        },
        { transaction }
      );
    });
  } catch (error) {
    if (error instanceof BaseError) throw getErrorFromSequelizeError(error);
    throw error;
  }
};

export const updateProfileById = async (
  profileId: number | string,
  userProfileDTO: UserProfileDTO
) => {
  try {
    if (userProfileDTO.profileId) delete userProfileDTO.profileId;

    if (typeof profileId === 'string') profileId = parseInt(profileId);
    return await db.sequelize.transaction(async (transaction) => {
      const [affectedCount] = await UserProfile.update(
        { ...userProfileDTO },
        { where: { profileId }, transaction }
      );
      if (affectedCount !== 1) throw new NotFoundError();
      return affectedCount;
    });
  } catch (error) {
    throw getErrorFromSequelizeError(error as BaseError);
  }
};

export const updateProfileByInstance = async (
  profile: UserProfile,
  userProfileDTO: UserProfileDTO
) => {
  try {
    return await profile.update({ ...userProfileDTO });
  } catch (error) {
    if (error instanceof BaseError) throw getErrorFromSequelizeError(error);
    throw error;
  }
};

export const setPrimaryProfile = async (
  user: UserIdType | User | null,
  profile: number | UserProfile | null
) => {
  if (typeof profile === 'number') {
    profile = await findProfileById(profile);
  }

  if (typeof user === 'number') {
    user = await findUserById(user);
  }

  if (!profile || !user) throw new ApiError('ERR_CHANGE_PRIMARY_PROFILE');

  const userId = user.userId;
  const originalPrimaryProfileId = user.primaryProfileId;
  const newPrimaryProfileId = profile.profileId;

  try {
    await db.sequelize.transaction(async (transaction) => {
      await UserProfile.update(
        { isPrimary: false },
        { where: { profileId: originalPrimaryProfileId }, transaction }
      );
      await User.update(
        { primaryProfileId: newPrimaryProfileId },
        { where: { userId }, transaction }
      );
    });
  } catch (error) {
    if (error instanceof BaseError) throw getErrorFromSequelizeError(error);
    throw error;
  }
};

export const deleteProfileById = async (profileId: number | string) => {
  if (typeof profileId === 'string') profileId = parseInt(profileId);
  try {
    return await db.sequelize.transaction(async (transaction) => {
      const affectedCount = await UserProfile.destroy({
        where: { profileId },
        transaction,
      });
      if (affectedCount !== 1) throw new NotFoundError();
      return affectedCount;
    });
  } catch (error) {
    if (error instanceof BaseError) throw getErrorFromSequelizeError(error);
    throw error;
  }
};
