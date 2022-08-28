import { NextFunction, Request, Response } from 'express';
import User, { UserDTO } from '../../models/User';
import BadRequestError from '../../utils/errors/BadRequestError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import { deleteUser, updateUser } from '../database/user';

export const userToJSON = (user: User) => {
  const {
    id,
    userName,
    userNameUpdatedAt,
    email,
    metamaskWallet,
    googleAccount,
    twitterHandle,
    discordAccount,
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
    googleAccount,
    twitterHandle,
    discordAccount,
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
      isTester,
      locale,
      theme,
      emailEssential,
      emailMarketing,
      cookiesEssential,
      cookiesAnalytics,
      cookiesFunctional,
      cookiesTargeting,
    } = req.body;

    const userDTO = {
      userName,
      email,
      isTester,
      locale,
      theme,
      emailEssential,
      emailMarketing,
      cookiesEssential,
      cookiesAnalytics,
      cookiesFunctional,
      cookiesTargeting,
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
    const { userName } = req.query;

    // Check if username exists
    if (!userName) throw new BadRequestError();

    // Validation already performed with middleware, so
    // if we reached here, username is available
    res.status(200).json({ success: true, userName });
  } catch (error) {
    next(error);
  }
};
