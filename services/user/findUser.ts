import { BaseError } from 'sequelize';
import User, { UserIdType, UserInstanceAttributes } from '../../models/User';
import UserProfile from '../../models/UserProfile';
import DatabaseError from '../../utilities/errors/DatabaseError';

/**
 * Find a user with the ID
 * @param userId
 * @returns User with the given user ID
 * @throws DatabaseError if user is not found
 */
export const findUserById = async (userId: UserIdType) => {
  try {
    return await User.findByPk(userId, { include: UserProfile });
  } catch (error) {
    throw new DatabaseError(error as BaseError);
  }
};

/**
 * Find a user with username
 * @param userName
 * @returns User
 * @throws DatabaseError if user is not found
 */
export const findUserByUserName = async (
  userName: UserInstanceAttributes['userName']
) => {
  try {
    return await User.findOne({ where: { userName }, include: UserProfile });
  } catch (error) {
    throw new DatabaseError(error as BaseError);
  }
};

/**
 * Find a user with Google ID
 * @param googleProfileId Google ID
 * @returns User
 * @throws DatabaseError if user is not found
 */
export const findUserByGoogleId = async (
  googleProfileId: UserInstanceAttributes['googleProfileId']
) => {
  try {
    return await User.findOne({
      where: { googleProfileId },
      include: UserProfile,
    });
  } catch (error) {
    throw new DatabaseError(error as BaseError);
  }
};
