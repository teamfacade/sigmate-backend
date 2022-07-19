import { NextFunction, Request, Response } from 'express';
import User, { UserDTO } from '../../../models/User';
import {
  deleteUser,
  findUserById,
  updateUser,
} from '../../../services/database/user';
import ForbiddenError from '../../../utils/errors/ForbiddenError';

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
    if (req.user) {
      const response: UserResponse = {
        success: true,
        user: await findUserById(req.user.userId),
      };
      res.status(200).json(response);
    } else {
      throw new ForbiddenError();
    }
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
    if (req.user) {
      const userDTO: UserDTO = req.body;
      userDTO.userId = req.user.userId;

      await updateUser(userDTO);

      const response: UserResponse = {
        success: true,
        user: await findUserById(userDTO.userId),
      };
      res.status(200).json(response);
    } else {
      throw new ForbiddenError();
    }
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
    if (req.user) {
      await deleteUser(req.user.userId);
      res.status(204).send();
    } else {
      throw new ForbiddenError();
    }
  } catch (error) {
    return next(error);
  }
};
