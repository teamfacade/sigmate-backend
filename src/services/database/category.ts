import db from '../../models';
import Category, {
  CategoryAttributes,
  CategoryCreationAttributes,
  CategoryDeleteDTO,
} from '../../models/Category';
import User from '../../models/User';
import UserDevice from '../../models/UserDevice';
import BadRequestError from '../../utils/errors/BadRequestError';
import ConflictError from '../../utils/errors/ConflictError';
import NotFoundError from '../../utils/errors/NotFoundError';
import SequelizeError from '../../utils/errors/SequelizeError';

export const getCategoryById = async (categoryId: number | string) => {
  if (!categoryId) return null;
  if (typeof categoryId !== 'number') {
    categoryId = parseInt(categoryId);
    if (isNaN(categoryId)) throw new BadRequestError();
  }
  try {
    return await Category.findByPk(categoryId);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getCategories = async (page: number, limit = 50) => {
  if (typeof page !== 'number' || page <= 0) return null;
  if (typeof limit !== 'number' || limit <= 0) return null;

  try {
    return await Category.findAll({ limit, offset: limit * (page - 1) });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createCategory = async (
  categoryDTO: CategoryCreationAttributes,
  createdBy: User,
  createdByDevice: UserDevice
) => {
  try {
    const oldCategory = await Category.findOne({
      where: { name: categoryDTO.name },
    });
    if (oldCategory) {
      // already exists. stop
      throw new BadRequestError();
    }

    // Create a new one and return
    return await db.sequelize.transaction(async (transaction) => {
      const category = await Category.create(categoryDTO, { transaction });
      await Promise.all([
        category.$set('createdBy', createdBy, { transaction }),
        category.$set('createdByDevice', createdByDevice, { transaction }),
      ]);
      return category;
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const updateCategory = async (
  categoryDTO: Partial<CategoryAttributes>
) => {
  try {
    if (!categoryDTO.id) throw new BadRequestError();
    await Category.update(categoryDTO, { where: { id: categoryDTO.id } });
    return await Category.findByPk(categoryDTO.id);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const deleteCategory = async (categoryDTO: CategoryDeleteDTO) => {
  try {
    if (!categoryDTO.id) throw new BadRequestError();

    return await db.sequelize.transaction(async (transaction) => {
      const affectedRowCount = await Category.destroy({
        where: categoryDTO,
        transaction,
      });
      if (affectedRowCount === 0) throw new NotFoundError();
      if (affectedRowCount > 1) throw new ConflictError();
      return affectedRowCount;
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
