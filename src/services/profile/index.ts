import { NextFunction, Request, Response } from 'express';
import { UserProfileAttributes } from '../../models/UserProfile';
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
    userName: string;
  };
  profile: Omit<UserProfileAttributes, 'user'>;
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
      user: {
        id: req.isAuthenticated() ? profile.user.id || undefined : undefined,
        userName,
      },
      profile: {
        id: profile.id,
        displayName: profile.displayName,
        bio: profile.bio,
        profileImage: profile.profileImage,
        profileImageUrl: profile.profileImageUrl,
      },
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
      user: {
        id: req.isAuthenticated() ? user.id : undefined,
        userName: user?.userName,
      },
      profile: {
        id: user.primaryProfile.id,
        displayName: user.primaryProfile.displayName,
        bio: user.primaryProfile.bio,
        profileImage: user.primaryProfile.profileImage,
        profileImageUrl: user.primaryProfile.profileImageUrl,
      },
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
      profile: {
        id: profile.id,
        displayName: profile.displayName,
        bio: profile.bio,
        profileImage: profile.profileImage,
        profileImageUrl: profile.profileImageUrl,
      },
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
      profile: {
        id: updatedProfile.id,
        displayName: updatedProfile.displayName,
        bio: updatedProfile.bio,
        profileImage: updatedProfile.profileImage,
        profileImageUrl: updatedProfile.profileImageUrl,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
