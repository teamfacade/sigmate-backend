import { randomBytes } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { userPublicInfoToJSON } from '.';
import { createPgRes } from '../../middlewares/handlePagination';
import BadRequestError from '../../utils/errors/BadRequestError';
import { getReferredUsers } from '../database/user';

/**
 * Generate new referral code for a user
 * This function does not gurantee that the generated referral code is unique
 * @returns Referral Code
 */
const CODE_PREFIX = 'sg-';
export const generateReferralCode = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    randomBytes(6, (err, buf) => {
      if (err) {
        reject(err);
      }
      const bufStr = buf.toString('hex');
      const code = CODE_PREFIX + bufStr.slice(0, 6) + '-' + bufStr.slice(6, 12);
      resolve(code);
    });
  });
};

export const getReferredUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const pg = req.pg;
    if (!pg) throw new BadRequestError();
    const { rows: users, count } = await getReferredUsers(user, pg);
    const usersRes = await Promise.all(
      users.map((user) => userPublicInfoToJSON(user))
    );
    const data = createPgRes({
      limit: pg.limit,
      offset: pg.offset,
      count,
      data: usersRes,
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
