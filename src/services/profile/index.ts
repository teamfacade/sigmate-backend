import { NextFunction, Request, Response } from 'express';
import User from '../../models/User';
import UserProfile, { UserProfileAttributes } from '../../models/UserProfile';
import BadRequestError from '../../utils/errors/BadRequestError';
import ConflictError from '../../utils/errors/ConflictError';
import NotFoundError from '../../utils/errors/NotFoundError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import {
  findProfileById,
  getPrimaryProfile,
  updatePrimaryProfile,
} from '../database/profile';
import { findUserByUserName } from '../database/user';

export type ProfileResponse = {
  success: boolean;
  user?: {
    id?: number;
    userName?: string;
    metamaskWallet?: string;
    twitterHandle?: string;
    discordAccount?: string;
  };
  profile?: Omit<UserProfileAttributes, 'user'>;
};

const profileToJSON = (
  profile: UserProfile,
  user: User | undefined = undefined
) => {
  const res: Omit<ProfileResponse, 'success'> = {};
  user = user || profile.user;

  if (user) {
    res.user = {
      id: user.id,
      userName: user.userName,
      metamaskWallet: user.isMetamaskWalletPublic
        ? user.metamaskWallet
        : undefined,
      twitterHandle: user.isTwitterHandlePublic
        ? user.twitterHandle
        : undefined,
      discordAccount: user.isDiscordAccountPublic
        ? user.discordAccount
        : undefined,
    };
  }

  res.profile = {
    id: profile.id,
    displayName: profile.displayName,
    bio: profile.bio,
    profileImage: profile.profileImage,
    profileImageUrl: profile.profileImageUrl,
  };

  return res;
};

export const getProfileByProfileIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { profileId } = req.params;
    const profileIdNumber = parseInt(profileId);
    if (isNaN(profileIdNumber)) throw new BadRequestError();
    const profile = await findProfileById(profileIdNumber);

    if (!profile) throw new NotFoundError();
    if (!profile.user) throw new ConflictError();

    const userName = profile.user.userName;
    if (!userName) throw new NotFoundError();

    const response: ProfileResponse = {
      success: true,
      ...profileToJSON(profile),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getProfileByUserNameController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userName } = req.params;
    const user = await findUserByUserName(userName);
    if (!user || !user.userName) throw new NotFoundError();
    const response: ProfileResponse = {
      success: true,
      ...profileToJSON(user.primaryProfile, user),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getMyProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) throw new UnauthenticatedError();

    const profile = await getPrimaryProfile(user);
    if (!profile) throw new ConflictError();

    const response: ProfileResponse = {
      success: true,
      ...profileToJSON(profile),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateMyPrimaryProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) throw new UnauthenticatedError();

    const { displayName, bio } = req.body;

    const updatedProfile = await updatePrimaryProfile(user, {
      displayName,
      bio,
    });

    const response: ProfileResponse = {
      success: true,
      ...profileToJSON(updatedProfile),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
