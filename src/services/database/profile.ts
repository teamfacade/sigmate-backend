import { BaseError } from 'sequelize';
import db from '../../models';
import { UserIdType } from '../../models/User';
import UserProfile, { UserProfileDTO } from '../../models/UserProfile';
import NotFoundError from '../../utils/errors/NotFoundError';
import getErrorFromSequelizeError from '../../utils/getErrorFromSequelizeError';

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
