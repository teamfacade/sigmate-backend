import User from '../../models/User';
import UserProfile from '../../models/UserProfile';
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
