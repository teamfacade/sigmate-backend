import { NextFunction, Request, Response } from 'express';
import { getCategories } from '../database/forum';

export const getCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.pg) {
      const { limit, page } = req.pg;
      const categories = await getCategories(page, limit);
      res.status(200).json({ success: true, categories });
    }
    res.status(400).send();
  } catch (error) {
    next(error);
  }
};
