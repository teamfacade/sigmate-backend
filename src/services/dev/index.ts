import { Request, Response, NextFunction } from 'express';
import db from '../../models';

export const syncDatabaseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let force = (req.query.force as unknown as boolean) || false;
    if (process.env.NODE_ENV !== 'development') {
      force = false;
    }
    await db.sequelize.sync({ force, logging: false });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
