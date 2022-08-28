import User from '../../models/User';
import UserProfile, { UserProfileDTO } from '../../models/UserProfile';
import ConflictError from '../../utils/errors/ConflictError';
import SequelizeError from '../../utils/errors/SequelizeError';

export const findProfileById = async (id: number) => {
  try {
    return await UserProfile.findOne({
      where: { id },
      include: [User],
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getPrimaryProfile = async (user: User) => {
  try {
    return user.primaryProfile || (await user.$get('primaryProfile'));
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const updatePrimaryProfile = async (
  user: User,
  userProfileDTO: UserProfileDTO
) => {
  try {
    const profile = user.primaryProfile || (await user.$get('primaryProfile'));
    if (!profile) throw new ConflictError();

    // Prevent editing the id
    if (userProfileDTO.id) {
      delete userProfileDTO.id;
    }

    return await profile.update(userProfileDTO);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
