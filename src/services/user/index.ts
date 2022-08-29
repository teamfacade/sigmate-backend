import { NextFunction, Request, Response } from 'express';
import User, { UserDTO } from '../../models/User';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import {
  deleteUser,
  findUserByReferralCode,
  findUserByUserName,
  updateUser,
} from '../database/user';

export const userToJSON = (user: User) => {
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

  const userJSON = {
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
  };

  if (!adminUser) delete userJSON.adminUser;

  return userJSON;
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
      const user = await findUserByReferralCode(referralCode);
      if (user) {
        // If it is my own referralCode, return not valid
        const me = req.user;
        if (!me) throw new UnauthenticatedError();
        if (user.id !== me.id) response.referralCode.isValid = true;
      }

      if (response.success) response.success = response.referralCode.isValid;
    }

    res.status(response.success ? 200 : 409).json(response);
  } catch (error) {
    next(error);
  }
};
