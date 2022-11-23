import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import {
  isReferralCode,
  isReferralCodeMine,
} from '../../middlewares/validators/user';
import User, {
  UserDTO,
  UserPublicResponse,
  UserResponse,
} from '../../models/User';
import { UserProfileAttributes } from '../../models/UserProfile';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import {
  dailyCheckIn,
  deleteUser,
  findUserByReferralCode,
  findUserByUserName,
  updateUser,
} from '../database/user';

export const userToJSON = (user: User) => {
  if (!user) return null;

  const {
    id,
    userName,
    userNameUpdatedAt,
    email,
    metamaskWallet,
    isMetamaskWalletPublic,
    googleAccount,
    twitterHandle,
    isTwitterHandlePublic,
    discordAccount,
    isDiscordAccountPublic,
    isTester,
    isAdmin,
    locale,
    theme,
    emailEssential,
    emailMarketing,
    cookiesEssential,
    cookiesAnalytics,
    cookiesFunctional,
    cookiesTargeting,
    agreeTos,
    agreePrivacy,
    agreeLegal,
    referralCode,
    group,
    primaryProfile,
    referredBy,
    adminUser,
  } = user.toJSON();

  const userJSON: UserResponse = {
    id,
    userName,
    userNameUpdatedAt,
    email,
    metamaskWallet,
    isMetamaskWalletPublic,
    googleAccount,
    twitterHandle,
    isTwitterHandlePublic,
    discordAccount,
    isDiscordAccountPublic,
    isTester,
    isAdmin,
    locale,
    theme,
    emailEssential,
    emailMarketing,
    cookiesEssential,
    cookiesAnalytics,
    cookiesFunctional,
    cookiesTargeting,
    agreeTos,
    agreePrivacy,
    agreeLegal,
    referralCode,
    group,
    primaryProfile,
    referredBy: referredBy ? referredBy.referralCode : null,
    adminUser,
  };

  if (!adminUser) delete userJSON.adminUser;

  return userJSON;
};

export const userPublicAttributes = [
  'id',
  'userName',
  'metamaskWallet',
  'isMetamaskWalletPublic',
  'twitterHandle',
  'isTwitterHandlePublic',
  'discordAccount',
  'isDiscordAccountPublic',
];

export const userPublicInfoToJSON = async (
  user: User | null
): Promise<UserPublicResponse | null> => {
  if (!user) return null;
  const p = user?.primaryProfile || (await user?.$get('primaryProfile'));
  if (!p) return null;
  const primaryProfile = _.pick(p, [
    'id',
    'displayName',
    'bio',
    'profileImageUrl',
    'profileImage',
  ]) as Omit<UserProfileAttributes, 'user'>;
  const response: UserPublicResponse = {
    id: user.id,
    userName: user.userName,
    metamaskWallet: user.isMetamaskWalletPublic
      ? user.metamaskWallet
      : undefined,
    twitterHandle: user.isTwitterHandlePublic ? user.twitterHandle : undefined,
    discordAccount: user.isDiscordAccountPublic
      ? user.discordAccount
      : undefined,
    primaryProfile,
    createdAt: user.createdAt,
  };
  return response;
};

export const getUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) throw new UnauthenticatedError();

    res.status(200).json({ success: true, user: userToJSON(user) });
  } catch (error) {
    next(error);
  }
};

export const patchUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) throw new UnauthenticatedError();

    const {
      userName,
      email,
      isMetamaskWalletPublic,
      isTwitterHandlePublic,
      isDiscordAccountPublic,
      isTester,
      locale,
      theme,
      emailEssential,
      emailMarketing,
      cookiesEssential,
      cookiesAnalytics,
      cookiesFunctional,
      cookiesTargeting,
      agreeTos,
      agreeLegal,
      agreePrivacy,
      referredBy: referredByCode,
    } = req.body;

    const userDTO = {
      userName,
      email,
      isMetamaskWalletPublic,
      isTwitterHandlePublic,
      isDiscordAccountPublic,
      isTester,
      locale,
      theme,
      emailEssential,
      emailMarketing,
      cookiesEssential,
      cookiesAnalytics,
      cookiesFunctional,
      cookiesTargeting,
      agreeTos,
      agreeLegal,
      agreePrivacy,
      referredByCode,
    } as UserDTO;

    const updatedUser = await updateUser(user, userDTO);

    res.status(200).json({ success: true, user: userToJSON(updatedUser) });
  } catch (error) {
    next(error);
  }
};

export const deleteUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) throw new UnauthenticatedError();

    await deleteUser(user);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const checkUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userName = req.query?.userName as string;
    const referralCode = req.query?.referralCode as string;

    const response: {
      success: boolean;
      userName?: {
        userName: string;
        isAvailable: boolean;
      };
      referralCode?: {
        referralCode: string;
        isValid: boolean;
      };
    } = { success: true };

    // Check if username is available
    if (userName) {
      response.userName = { userName, isAvailable: true };
      const user = await findUserByUserName(userName);
      if (user) {
        response.success = false;
        response.userName.isAvailable = false;
      }
    }

    // Check if referralcode is valid
    if (referralCode) {
      response.referralCode = { referralCode, isValid: false };
      if (
        isReferralCode(referralCode) && // Check that it is a valid referralCode
        !isReferralCodeMine(referralCode, req) // and isn't my own
      ) {
        // Look for a user with the given referralCode
        const referredUser = await findUserByReferralCode(referralCode);
        if (referredUser) response.referralCode.isValid = true;
      }
      if (response.success) response.success = response.referralCode.isValid;
    }

    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    next(error);
  }
};

export const dailyCheckInController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const att = await dailyCheckIn(req.user, req.device);
    if (att) {
      res.status(200).json({
        success: true,
        attendance: {
          createdAt: att.createdAt,
        },
      });
    } else {
      res.status(409).json({
        success: false,
        attendance: {
          msg: 'ALREADY_CHECKED_IN',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
