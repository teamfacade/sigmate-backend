import { NextFunction, Request, Response } from 'express';
import User, { UserDTO } from '../../../../models/User';
import { findUserById, updateUser } from '../../../../services/database/user';
import BadRequestError from '../../../../utils/errors/BadRequestError';

type UserResponse = {
  success: boolean;
  user: User;
};

/**
 * Edit user information (admins only)
 */
export const adminPatchUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userDTO: UserDTO = req.body;
    if (!userDTO.userId) throw new BadRequestError();

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
