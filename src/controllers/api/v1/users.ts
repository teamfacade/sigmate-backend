import { NextFunction, Request, Response } from 'express';
import User, { UserDTO } from '../../../models/User';
import {
  deleteUser,
  findUserById,
  updateUser,
} from '../../../services/database/user';

export type UserResponse = {
  success: boolean;
  user: User;
};

export const patchUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userDTO: UserDTO = req.body;
    userDTO.userId = req.params.userId;

    await updateUser(userDTO);

    const response: UserResponse = {
      success: true,
      user: await findUserById(userDTO.userId),
    };
    res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
};

export const deleteUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    await deleteUser(userId);

    res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
