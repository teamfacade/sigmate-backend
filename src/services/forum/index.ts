import { NextFunction, Request, Response } from 'express';
import Category, {
  CategoryAttributes,
  CategoryDeleteDTO,
  CategoryResponse,
} from '../../models/Category';
import ApiError from '../../utils/errors/ApiError';
import BadRequestError from '../../utils/errors/BadRequestError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../database/category';

export const categoryToJSON = (category: Category, all = false) => {
  const categoryJSON = category.toJSON();
  if (all) return categoryJSON;
  const categoryResponse: CategoryResponse = {
    id: categoryJSON.id,
    name: categoryJSON.name,
    description: categoryJSON.description,
    parent: categoryJSON.parent || undefined,
  };
  return categoryResponse;
};

export const getCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.pg) {
      const { limit, page } = req.pg;
      const categories = await getCategories(page, limit);
      res.status(200).json({
        success: true,
        categories: categories?.map((c) => categoryToJSON(c)),
      });
    } else {
      res.status(400).send();
    }
  } catch (error) {
    next(error);
  }
};

export const createCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const u = req.user;
    if (!u) throw new UnauthenticatedError();
    const d = req.device;
    if (!d) throw new ApiError('ERR_DEVICE');

    const name = req.body.name as string;
    const description = req.body.description as string;

    const category = await createCategory({ name, description }, u, d);
    res.status(201).json({
      success: true,
      category: categoryToJSON(category),
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const u = req.user;
    if (!u) throw new UnauthenticatedError();
    const d = req.device;
    if (!d) throw new UnauthenticatedError();

    const categoryDTO: Partial<CategoryAttributes> = {};

    req.body.id && (categoryDTO.id = req.body.id);
    req.body.name && (categoryDTO.name = req.body.name);
    req.body.description && (categoryDTO.description = req.body.description);

    const category = await updateCategory(categoryDTO);
    if (!category) throw new ApiError('ERR_DB_CATEGORY');

    res.status(200).json({ success: true, category: categoryToJSON(category) });
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = (req.body.id as number) || undefined;
    const name = (req.body.name as string) || undefined;

    const categoryDeleteDTO: CategoryDeleteDTO = {};

    if (id) {
      categoryDeleteDTO.id = id;
    }

    if (name) {
      categoryDeleteDTO.name = name;
    }

    if (!id && !name) throw new BadRequestError();

    await deleteCategory(categoryDeleteDTO);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
