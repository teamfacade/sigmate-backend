import { NextFunction, Request, Response } from 'express';
import UserProfile from '../../../models/UserProfile';
import {
  deleteProfileById,
  findProfileById,
  findProfilesByUserId,
  updateProfileByInstance,
} from '../../../services/database/profile';
import BadRequestError from '../../../utils/errors/BadRequestError';
import ForbiddenError from '../../../utils/errors/ForbiddenError';
import NotFoundError from '../../../utils/errors/NotFoundError';

type ProfileResponse = {
  success: boolean;
  profile: UserProfile | UserProfile[];
};

export const getProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { profileId } = req.params;
    if (profileId === undefined) throw new BadRequestError();
    const profile = await findProfileById(profileId);
    if (!profile) throw new NotFoundError();
    const response: ProfileResponse = {
      success: true,
      profile,
    };
    res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
};

export const getMyProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    if (!user) throw new ForbiddenError();
    const profile = await findProfilesByUserId(user.userId);
    if (!profile) throw new NotFoundError();
    const response: ProfileResponse = {
      success: true,
      profile,
    };
    res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
};

export const updateMyProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const profileId = parseInt(req.params.profileId || req.body.profileId);
    if (!profileId || isNaN(profileId)) throw new BadRequestError();

    const userId = req.user?.userId;
    if (!userId) {
      throw new ForbiddenError();
    }

    const profiles = await findProfilesByUserId(userId);
    const profile = profiles.filter(
      (profile) => profile.profileId === profileId
    );
    const isMyProfile = profile.length === 1;
    if (!isMyProfile) {
      throw new ForbiddenError();
    }

    const userProfileDTO = req.body;
    const updatedProfile = await updateProfileByInstance(
      profile[0],
      userProfileDTO
    );

    const response: ProfileResponse = {
      success: true,
      profile: updatedProfile,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteMyProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenError();

    const { profileId } = req.body;
    if (!profileId) throw new BadRequestError();

    const profiles = await findProfilesByUserId(userId);
    const profile = profiles.filter(
      (profile) => profile.profileId === profileId
    );
    const isMyProfile = profile.length === 1;
    if (!isMyProfile) throw new ForbiddenError();

    const deletedCount = await deleteProfileById(profileId);
    if (deletedCount !== 1) throw new NotFoundError();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
