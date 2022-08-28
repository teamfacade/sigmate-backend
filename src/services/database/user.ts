import { Credentials } from 'google-auth-library';
import db from '../../models';
import User, { UserCreationDTO } from '../../models/User';
import UserAuth, { UserAuthDTO } from '../../models/UserAuth';
import UserGroup from '../../models/UserGroup';
import UserProfile, {
  UserProfileCreationAttributes,
  UserProfileCreationDTO,
} from '../../models/UserProfile';
import ApiError from '../../utils/errors/ApiError';
import SequelizeError from '../../utils/errors/SequelizeError';
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
