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
    // Check authentication
    const { user } = req;
    if (!user || !user.id) throw new UnauthenticatedError();

    // Get all profiles for user
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
    // Check authentication
    const userId = req.user?.userId;
    if (!req.user || !userId) throw new UnauthenticatedError();

    // Create profile
    const userProfileDTO: UserProfileCreationDTO = req.body;
    const profile = await createProfileForUser(userId, userProfileDTO);

    // Set this to be the new primary profile (if necessary)
    if (userProfileDTO.isPrimary) {
      await setPrimaryProfile(req.user, profile);
    }

    // Send the newly created profile back to the client
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
    // Check if profileId is specified in either params or body
    const profileId = parseInt(req.params.profileId || req.body.profileId);
    if (!profileId || isNaN(profileId)) throw new BadRequestError();

    // Check if we are authenticated
    const userId = req.user?.userId;
    if (!req.user || !userId) {
      throw new UnauthenticatedError();
    }

    // Look for the profile and check if it is mine
    const profiles = await findProfilesByUserId(userId);
    const profile = profiles.filter(
      (profile) => profile.profileId === profileId
    );
    const isMyProfile = profile.length === 1;
    if (!isMyProfile) {
      throw new ForbiddenError();
    }

    // Handle primary profiles
    const wasPrimaryProfile = profile[0].isPrimary;
    const userProfileDTO = req.body;

    // Primary profiles cannot be unset directly
    // To change a primary profile, *set* another profile to be primary
    if (wasPrimaryProfile && userProfileDTO.isPrimary === false) {
      throw new ConflictError();
    }

    // Perform the DB update
    const updatedProfile = await updateProfileByInstance(
      profile[0],
      userProfileDTO
    );

    // New primary profile
    if (!wasPrimaryProfile && userProfileDTO.isPrimary) {
      await setPrimaryProfile(req.user, updatedProfile);
    }

    // Send the response back
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
    // Check if we are authenticated
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenError();

    // Check if profileId has been specified
    const profileId = parseInt(req.body.profileId || req.params.profileId);
    if (!profileId || isNaN(profileId)) throw new BadRequestError();

    // Look for the profile and check if it is mine
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

    // Perform the DB update
    const deletedCount = await deleteProfileById(profileId);
    if (deletedCount !== 1) throw new NotFoundError();

    res.status(204).send(); // 204 no content
  } catch (error) {
    next(error);
  }
};
