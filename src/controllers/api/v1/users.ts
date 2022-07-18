import { NextFunction, Request, Response } from 'express';
import User, { UserDTO } from '../../../models/User';
import { findUserById, updateUser } from '../../../services/database/user';

export type UserResponse = {
  success: boolean;
  user: User;
};

export const patchUser = async (
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
