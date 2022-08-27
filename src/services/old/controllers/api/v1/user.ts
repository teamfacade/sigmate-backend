import { NextFunction, Request, Response } from 'express';
import User, { UserDTO } from '../../../models/User';
import {
  deleteUser,
  findUserById,
  findUserByReferralCode,
  renewReferralCode,
  updateUser,
} from '../../../services/database/user';
import BadRequestError from '../../../utils/errors/BadRequestError';
import ConflictError from '../../../utils/errors/ConflictError';
import NotFoundError from '../../../utils/errors/NotFoundError';
import UnauthenticatedError from '../../../utils/errors/UnauthenticatedError';

export type UserResponse = {
  success: boolean;
  user: User;
};

/**
 * Get my user information
 */
export const getUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check authentication
    if (req.isUnauthenticated() || !req.user?.userId)
      throw new UnauthenticatedError();

    // Look for the specified user
    const response: UserResponse = {
      success: true,
      user: await findUserById(req.user.userId),
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Edit my user information
 */
export const patchUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check authentication
    if (req.isUnauthenticated() || !req.user?.userId)
      throw new UnauthenticatedError();

    const userDTO: UserDTO = req.body;

    // Enforce the user ID to be the currently authenticated user
    userDTO.userId = req.user.userId;

    // If the user is 'unauthenticated',
    // (a.k.a. created the account but not finished the sign up process)
    // perform additional checks and update the user to 'newbie' if needed
    if (req.user.group === 'unauthenticated') {
      // Email is verified
      const isEmailVerified = req.user.emailVerified;

      // Agreed to everything
      // Terms of services, Privacy, Legal
      const agreedToEverything =
        req.user.agreeTos && req.user.agreePrivacy && req.user.agreeLegal;

      // Username is set
      const userNameSet = req.user.userName && req.user.userNameUpdatedAt;

      // If all is good, upgrade to 'newbie' user group
      if (isEmailVerified && agreedToEverything && userNameSet) {
        userDTO.group = 'newbie';
      }
    }

    // Perform the DB update
    await updateUser(userDTO);

    // Return the updated user information
    const response: UserResponse = {
      success: true,
      user: await findUserById(userDTO.userId),
    };
    res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete my account
 */
export const deleteUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check authentication
    if (req.isUnauthenticated() || !req.user?.userId)
      throw new UnauthenticatedError();
    await deleteUser(req.user.userId); // Perform the deletion
    res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

/**
 * Check if requested username can be used
 */
export const checkUserNameController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userName } = req.body;

    // Check if username exists
    if (!userName) throw new BadRequestError();

    // Validation already performed with middleware, so
    // if we reached here, username is available

    res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
};

/**
 * Generate a new referral code for a user, invalidating the old one
 */
export const getReferralCodeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.isUnauthenticated() || !req.user) throw new UnauthenticatedError();
    const userId = req.user.userId;

    const user = await findUserById(userId);
    if (!user) throw new NotFoundError();

    res.status(200).json({
      success: true,
      referralCode: user.referralCode,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Renew the current user's referral code
 */
export const postReferralCodeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.isUnauthenticated() || !req.user) throw new UnauthenticatedError();
    const userId = req.user.userId;
    const renew = req.body.renew;
    if (!renew) throw new BadRequestError();

    const referralCode = await renewReferralCode(userId);
    res.status(200).json({ success: true, referralCode });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a partial profile of the user with the given referral code
 * @throws NotFoundError if the referral code does not belong to any user
 */
export const checkReferralController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const referralCode = req.params.referralCode;
    if (!referralCode) throw new BadRequestError();
    const user = await findUserByReferralCode(referralCode);
    if (!user) throw new NotFoundError();
    const profile = user.primaryProfile;
    res.status(200).json({
      success: true,
      profile: {
        displayName: profile.displayName,
        picture: profile.picture,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update the referral information of the current user
 */
export const updateReferralController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check authentication
    if (req.isUnauthenticated() || !req.user) throw new UnauthenticatedError();

    // Check if user is already referred by another user
    const referredBy = req.user.referredBy;
    if (referredBy) {
      // Cannot enter in a new referral code if the user
      // already entered a referral code
      throw new ConflictError();
    }

    // Get referral code from request
    const referralCode = req.body.referralCode;
    if (!referralCode) throw new BadRequestError();

    // Look for the user with the given referral code
    const referredUser = await findUserByReferralCode(referralCode);
    if (!referredUser) throw new NotFoundError();

    // Update the user with the given referral code
    const userDTO: UserDTO = {
      userId: req.user.userId,
      referredBy: referredUser.userId,
    };
    const affectedCount = await updateUser(userDTO);
    if (!affectedCount) throw new NotFoundError();

    res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
};
