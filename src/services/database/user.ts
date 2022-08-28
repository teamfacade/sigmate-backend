import { Credentials } from 'google-auth-library';
import db from '../../models';
import User, { UserCreationDTO, UserDTO } from '../../models/User';
import UserAuth, { UserAuthDTO } from '../../models/UserAuth';
import UserGroup from '../../models/UserGroup';
import UserProfile, {
  UserProfileCreationAttributes,
  UserProfileCreationDTO,
} from '../../models/UserProfile';
import ApiError from '../../utils/errors/ApiError';
import ConflictError from '../../utils/errors/ConflictError';
import SequelizeError from '../../utils/errors/SequelizeError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import { GoogleProfile } from '../auth/google';
import { createAccessToken, createRefreshToken } from '../auth/token';
import { generateReferralCode } from '../user/referral';

export const findUserById = async (userId: number) => {
  try {
    return await User.findOne({
      where: { id: userId },
      include: [UserGroup, UserProfile],
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const findUserByUserName = async (userName: string) => {
  try {
    return await User.findOne({
      where: { userName },
      include: [UserGroup, UserProfile],
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

/**
 * Check if the given referral code is already being used by another user
 * @param code referral code
 * @returns true if the given referral code is already in use, false otherwise
 */
const isReferralCodeTaken = async (code: string) => {
  try {
    const user = await User.findOne({ where: { referralCode: code } });
    return user ? true : false;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
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

export const createUser = async (
  userDTO: UserCreationDTO,
  userAuthDTO: UserAuthDTO,
  userProfileDTO: UserProfileCreationAttributes
) => {
  const referralCode = await generateUniqueReferralCode();
  try {
    const newbieUserGroup = await UserGroup.findOne({
      where: { groupName: 'newbie' },
    });

    if (!newbieUserGroup) throw new ApiError('ERR_USER_CREATE_USERGROUP_DB');

    const createdUser = await db.sequelize.transaction(async (transaction) => {
      const user = await User.create(
        {
          ...userDTO,
          referralCode,
        },
        { transaction }
      );

      const [primaryProfile, userAuth] = await Promise.all([
        user.$create<UserProfile>(
          'primaryProfile',
          { ...userProfileDTO },
          { transaction }
        ),
        user.$create<UserAuth>(
          'userAuth',
          {
            ...userAuthDTO,
            sigmateAccessToken: createAccessToken(
              user.id,
              newbieUserGroup.id,
              false
            ),
            sigmateRefreshToken: createRefreshToken(
              user.id,
              newbieUserGroup.id,
              false
            ),
          },
          { transaction }
        ),
        user.$set('group', newbieUserGroup, { transaction }),
      ]);

      user.primaryProfile = primaryProfile;
      user.userAuth = userAuth;

      return user;
    });

    if (!createdUser) throw new ApiError('ERR_DB');

    return createdUser;
  } catch (error) {
    console.error(error); // TODO remove
    throw new SequelizeError(error as Error);
  }
};

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

  const userProfileDTO: UserProfileCreationDTO = {
    displayName: googleProfile.displayName,
    profileImageUrl: googleProfile.coverPhoto,
  };

  return await createUser(userDTO, userAuthDTO, userProfileDTO);
};

export const updateUser = async (user: User, userDTO: UserDTO) => {
  try {
    // If username has been changed, record that time
    if (userDTO.userName) {
      userDTO.userNameUpdatedAt = new Date();
    }

    // If email has been changed, mark as unverified
    if (userDTO.email) {
      userDTO.emailVerified = false;
    }

    return await user.update(userDTO);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const deleteUser = async (user: User | null | undefined) => {
  try {
    if (!user) throw new UnauthenticatedError();
    const d = new Date().getTime();

    const userName = user.userName ? `${user.userName}-d${d}` : undefined;
    const email = user.email ? `${user.email || ''}-d${d}` : undefined;
    const googleAccountId = user.googleAccountId
      ? `${user.googleAccountId || ''}-d${d}`
      : undefined;

    const userAuth = user.userAuth || (await user.$get('userAuth'));
    if (!userAuth) throw new ConflictError();

    const primaryProfile =
      user.primaryProfile || (await user.$get('primaryProfile'));
    if (!primaryProfile) throw new ConflictError();

    const adminUser = user.adminUser || (await user.$get('adminUser'));

    await db.sequelize.transaction(async (transaction) => {
      const deletePromises: Promise<any>[] = [
        user.update(
          { userName, email, googleAccountId, isAdmin: false },
          { transaction }
        ),
        userAuth.destroy({ transaction }),
        primaryProfile.destroy({ transaction }),
      ];

      if (adminUser) deletePromises.push(adminUser.destroy({ transaction }));

      await Promise.all(deletePromises);
      await user.destroy({ transaction });
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
