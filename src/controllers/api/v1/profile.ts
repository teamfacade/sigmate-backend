import { NextFunction, Request, Response } from 'express';
import UserProfile, {
  UserProfileCreationDTO,
} from '../../../models/UserProfile';
import {
  createProfileForUser,
  deleteProfileById,
  findProfileById,
  findProfilesByUserId,
  setPrimaryProfile,
  updateProfileByInstance,
} from '../../../services/database/profile';
import BadRequestError from '../../../utils/errors/BadRequestError';
import ConflictError from '../../../utils/errors/ConflictError';
import ForbiddenError from '../../../utils/errors/ForbiddenError';
import NotFoundError from '../../../utils/errors/NotFoundError';
import UnauthenticatedError from '../../../utils/errors/UnauthenticatedError';

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
    if (!user) throw new UnauthenticatedError();
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

export const createMyProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!req.user || !userId) {
      throw new UnauthenticatedError();
    }
    const userProfileDTO: UserProfileCreationDTO = req.body;

    const profile = await createProfileForUser(userId, userProfileDTO);

    if (userProfileDTO.isPrimary) {
      await setPrimaryProfile(req.user, profile);
    }

    const response: ProfileResponse = {
      success: true,
      profile,
    };
    res.status(201).json(response);
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
    if (!req.user || !userId) {
      throw new UnauthenticatedError();
    }

    const profiles = await findProfilesByUserId(userId);
    const profile = profiles.filter(
      (profile) => profile.profileId === profileId
    );
    const isMyProfile = profile.length === 1;
    if (!isMyProfile) {
      throw new ForbiddenError();
    }
    const wasPrimaryProfile = profile[0].isPrimary;
    const userProfileDTO = req.body;

    if (wasPrimaryProfile && userProfileDTO.isPrimary === false) {
      throw new ConflictError();
    }

    const updatedProfile = await updateProfileByInstance(
      profile[0],
      userProfileDTO
    );

    if (!wasPrimaryProfile && userProfileDTO.isPrimary) {
      await setPrimaryProfile(req.user, updatedProfile);
    }

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

    const profileId = parseInt(req.body.profileId || req.params.profileId);
    if (!profileId || isNaN(profileId)) throw new BadRequestError();

    const profiles = await findProfilesByUserId(userId);
    const profile = profiles.filter(
      (profile) => profile.profileId === profileId
    );
    const isMyProfile = profile.length === 1;
    if (!isMyProfile) throw new ForbiddenError();

    // If it is a primary profile, it cannot be deleted
    if (profile[0].isPrimary) {
      throw new ConflictError('ERR_CANNOT_DELETE_PRIMARY_PROFILE', {
        clientMessage: 'ERR_CANNOT_DELETE_PRIMARY_PROFILE',
      });
    }

    const deletedCount = await deleteProfileById(profileId);
    if (deletedCount !== 1) throw new NotFoundError();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
