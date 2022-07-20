import { NextFunction, Request, Response } from 'express';
import User, { UserDTO } from '../../../models/User';
import {
  deleteUser,
  findUserById,
  updateUser,
} from '../../../services/database/user';
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
