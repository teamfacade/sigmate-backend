import { Credentials } from 'google-auth-library';
import { BaseError } from 'sequelize';
import db from '../../models';
import User, {
  UserCreationDTO,
  UserDTO,
  UserIdType,
  UserModelAttributes,
} from '../../models/User';
import UserAuth, { UserAuthDTO } from '../../models/UserAuth';
import UserProfile, { UserProfileDTO } from '../../models/UserProfile';
import getErrorFromSequelizeError from '../../utils/getErrorFromSequelizeError';
import { GoogleProfile } from '../auth/google';
import { createUserAuth } from './auth';
import ApiError from '../../utils/errors/ApiError';
import NotFoundError from '../../utils/errors/NotFoundError';
import AdminUser from '../../models/AdminUser';
import BadRequestError from '../../utils/errors/BadRequestError';
import { generateReferralCode } from '../user/referral';

const NEW_USER_USERGROUP = 'unauthenticated';

/**
 * Find a user by id
 * @param userId Id of user
 * @returns User
 * @throws NotFoundError if user is not found
 */
export const findUserById = async (userId: UserIdType) => {
  try {
    const user = await User.findByPk(userId, {
      include: { model: UserProfile, as: 'primaryProfile' },
    });
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
      include: { model: UserProfile, as: 'primaryProfile' },
      paranoid: !includeSoftDeleted,
    });
  } catch (error) {
    throw getErrorFromSequelizeError(error as BaseError);
  }
};

export const findUserByReferralCode = async (referralCode: string) => {
  try {
    return await User.findOne({
      where: { referralCode },
      include: { model: UserProfile, as: 'primaryProfile' },
    });
  } catch (error) {
    if (error instanceof BaseError) throw getErrorFromSequelizeError(error);
    throw error;
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
 * Check if the given referral code is already being used by another user
 * @param code referral code
 * @returns true if the given referral code is already in use, false otherwise
 */
const isReferralCodeTaken = async (code: string) => {
  const user = await User.findOne({ where: { referralCode: code } });
  if (user) {
    return true;
  }
  return false;
};

/**
 * Generate a unique referral code for a user
 * @returns Referral code for a user
 */
const generateUniqueReferralCode = async () => {
  let referralCode = await generateReferralCode();
  while (await isReferralCodeTaken(referralCode)) {
    referralCode = await generateReferralCode();
  }
  return referralCode;
};

/**
 * Generate a new referral code for the User and update the DB
 * @param userId Id of a User
 * @returns New referral code
 * @throws Sequelize.BaseError on DB error
 */
export const renewReferralCode = async (userId: UserIdType) => {
  try {
    const referralCode = await generateUniqueReferralCode();

    await db.sequelize.transaction(async (transaction) => {
      const [affectedCount] = await User.update(
        { referralCode },
        { where: { userId }, transaction }
      );
      if (affectedCount === 0) throw new NotFoundError();
    });

    return referralCode;
  } catch (error) {
    if (error instanceof BaseError) throw getErrorFromSequelizeError(error);
    throw error;
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
  const referralCode = await generateUniqueReferralCode();

  try {
    const createdUser = await db.sequelize.transaction(async (transaction) => {
      const user = await User.create(
        {
          ...userDTO,
          // Give same privileges as an unauthenticated user for now, and then
          // give newbie privileges when email is verified and username is set
          // (which is not done here)
          group: NEW_USER_USERGROUP,
          referralCode,
        },
        { transaction }
      );

      const userId = user.userId;

      const profile = await UserProfile.create(
        {
          userId,
          isPrimary: true,
          ...userProfileDTO,
        },
        { transaction }
      );

      await User.update(
        { primaryProfileId: profile.profileId },
        { where: { userId }, transaction }
      );

      const auth = await createUserAuth({
        userId,
        ...userAuthDTO,
      });
      if (!auth) throw new ApiError('ERR_DB');

      return await User.findOne({
        where: { userId },
        include: { model: UserProfile, as: 'primaryProfile' },
        transaction,
      });
    });
    if (!createdUser) throw new ApiError('ERR_DB');

    return createdUser;
  } catch (error) {
    console.error(error);
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
    googleAccount: googleProfile.email,
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
  if (userDTO.userId === undefined) throw new BadRequestError();

  // If a user is trying to update a username, record the time it was updated
  if (userDTO.userName) {
    userDTO.userNameUpdatedAt = new Date();
  }

  try {
    const affectedCount = await db.sequelize.transaction(
      async (transaction) => {
        const [affectedCount] = await User.update(
          { ...userDTO },
          { where: { userId: userDTO.userId }, transaction }
        );

        if (affectedCount === 0) throw new NotFoundError();
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

        // Delete associated entries in other tables
        await AdminUser.destroy({
          where: { userId: user.userId },
          transaction,
        });
        await UserAuth.destroy({ where: { userId: user.userId }, transaction });
        await UserProfile.destroy({
          where: { userId: user.userId },
          transaction,
        });

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
