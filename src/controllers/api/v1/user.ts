import { NextFunction, Request, Response } from 'express';
import User, { UserDTO } from '../../../models/User';
import {
  deleteUser,
  findUserById,
  updateUser,
} from '../../../services/database/user';
import BadRequestError from '../../../utils/errors/BadRequestError';
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
      const userNameSet =
        req.user.userName !== req.user.userId && req.user.userNameUpdatedAt;

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
