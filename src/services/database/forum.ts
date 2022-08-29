import Category from '../../models/Category';
import SequelizeError from '../../utils/errors/SequelizeError';

export const getCategories = async (page: number, limit = 50) => {
  if (typeof page !== 'number' || page <= 0) return null;
  if (typeof limit !== 'number' || limit <= 0) return null;

  try {
    return await Category.findAll({ limit, offset: limit * page });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
