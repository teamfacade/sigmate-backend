import { Transaction } from 'sequelize/types';
import { PaginationOptions } from '../../middlewares/handlePagination';
import db from '../../models';
import Category, { CategoryAttributes } from '../../models/Category';
import ForumComment from '../../models/ForumComment';
import ForumPost, {
  ForumPostAttributes,
  ForumPostCreationDTO,
} from '../../models/ForumPost';
import ForumPostView from '../../models/ForumPostView';
import ForumTag, { ForumTagAttributes } from '../../models/ForumTag';
import User from '../../models/User';
import UserDevice from '../../models/UserDevice';
import ApiError from '../../utils/errors/ApiError';
import BadRequestError from '../../utils/errors/BadRequestError';
import ConflictError from '../../utils/errors/ConflictError';
import NotFoundError from '../../utils/errors/NotFoundError';
import SequelizeError from '../../utils/errors/SequelizeError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';

export const getForumPostVoteCount = async (forumPost: ForumPost) => {
  try {
    const [likeCount, dislikeCount] = await Promise.all([
      forumPost.$count('votes', { where: { like: true } }),
      forumPost.$count('votes', { where: { like: false } }),
    ]);
    return likeCount - dislikeCount;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getForumPostById = async (
  forumPostId: ForumPostAttributes['id'],
  increaseViewCount = false,
  viewedBy: User | undefined = undefined,
  viewedByDevice: UserDevice | undefined = undefined
) => {
  if (!forumPostId) throw new BadRequestError({}, 'ERR_DB_FORUMPOST_ID');
  if (increaseViewCount) {
    if (!viewedByDevice)
      throw new BadRequestError({}, 'ERR_DB_FORUMPOST_DEVICE');
  }
  try {
    return await db.sequelize.transaction(async (transaction) => {
      const forumPost = await ForumPost.findByPk(forumPostId, { transaction });
      if (forumPost && increaseViewCount) {
        const forumPostView = await ForumPostView.create({}, { transaction });
        const ps: Promise<unknown>[] = [];
        viewedBy &&
          ps.push(forumPostView.$set('viewedBy', viewedBy, { transaction }));
        viewedByDevice &&
          ps.push(
            forumPostView.$set('viewedByDevice', viewedByDevice, {
              transaction,
            })
          );
        await Promise.all([
          ...ps,
          forumPostView.$set('post', forumPost, { transaction }),
          forumPost.$add('views', forumPostView, { transaction }),
        ]);
      }
      return forumPost;
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getForumPostsByCategory = async (
  category: Category | null,
  paginationOptions: PaginationOptions
) => {
  if (!category) throw new NotFoundError();
  try {
    return await category.$get('forumPosts', {
      limit: paginationOptions.limit,
      offset: paginationOptions.offset,
      include: [
        Category,
        ForumTag,
        { model: User, as: 'createdBy' },
        { model: UserDevice, as: 'createdByDevice' },
        { model: ForumComment, limit: 10 },
      ],
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const setForumPostCategoryNames = async (
  forumPost: ForumPost,
  categoryNames: CategoryAttributes['name'][],
  transaction: Transaction | undefined = undefined
) => {
  if (!forumPost || !categoryNames) throw new ConflictError();
  try {
    const createdBy =
      forumPost.createdBy || (await forumPost.$get('createdBy'));
    const createdByDevice =
      forumPost.createdByDevice || (await forumPost.$get('createdByDevice'));

    // TODO Prevent category creation if not admin

    // Create category if not exists
    const findOrCreateCategoryPromises = categoryNames.map((name) =>
      Category.findOrCreate({
        where: { name },
        include: [User, UserDevice],
        transaction,
      })
    );

    // For newly created categories, set the 'createdBy' as myself
    const findOrCreateCategoryResults = await Promise.all(
      findOrCreateCategoryPromises
    );
    const setCreatedByPromises: Promise<unknown>[] = [];
    findOrCreateCategoryResults.forEach(([category, created]) => {
      if (created) {
        setCreatedByPromises.push(
          category.$set('createdBy', createdBy, { transaction })
        );
        setCreatedByPromises.push(
          category.$set('createdByDevice', createdByDevice, { transaction })
        );
      }
    });

    // Set the categories on the ForumPost
    const categories = findOrCreateCategoryResults.map(
      ([category]) => category
    );
    await Promise.all([
      ...setCreatedByPromises,
      forumPost.$set('categories', categories, { transaction }),
    ]);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const setForumPostTagNames = async (
  forumPost: ForumPost,
  tagNames: ForumTagAttributes['name'][],
  transaction: Transaction | undefined = undefined
) => {
  if (!forumPost || !tagNames) throw new ConflictError();
  try {
    const createdBy =
      forumPost.createdBy || (await forumPost.$get('createdBy'));
    const createdByDevice =
      forumPost.createdByDevice || (await forumPost.$get('createdByDevice'));
    const findOrCreateTagPromises = tagNames.map((name) =>
      ForumTag.findOrCreate({
        where: { name },
        transaction,
      })
    );

    // Search for, or create tags
    const findOrCreateTagsResult = await Promise.all(findOrCreateTagPromises);

    // For new tags, set the 'createdBy' as myself
    const setCreatedByPromises: Promise<unknown>[] = [];
    findOrCreateTagsResult.forEach(([tag, created]) => {
      // Newly created tags
      if (created) {
        setCreatedByPromises.push(
          tag.$set('createdBy', createdBy, { transaction })
        );
        setCreatedByPromises.push(
          tag.$set('createdByDevice', createdByDevice, { transaction })
        );
      }
    });

    const tags = findOrCreateTagsResult.map(([tag]) => tag);
    await Promise.all([
      ...setCreatedByPromises,
      forumPost.$set('tags', tags, { transaction }),
    ]);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createForumPost = async (
  forumPostCreationDTO: ForumPostCreationDTO
) => {
  const { title, content, categories, tags, createdBy, createdByDevice } =
    forumPostCreationDTO;

  try {
    return await db.sequelize.transaction(async (transaction) => {
      const fp = await ForumPost.create({ title, content }, { transaction });
      if (!createdBy) throw new UnauthenticatedError();
      if (!createdByDevice) throw new ApiError('ERR_DEVICE');
      await Promise.all([
        fp.$set('createdBy', createdBy, { transaction }),
        fp.$set('createdByDevice', createdByDevice, { transaction }),
      ]);
      await Promise.all([
        setForumPostCategoryNames(fp, categories, transaction),
        setForumPostTagNames(fp, tags, transaction),
      ]);
      return await ForumPost.findByPk(fp.id, {
        include: [
          {
            model: Category,
            attributes: ['id', 'name', 'description', 'parentId'],
            through: { attributes: [] },
          },
          {
            model: ForumTag,
            attributes: ['id', 'name', 'isBanned'],
            through: { attributes: [] },
          },
          { model: User, as: 'createdBy' },
          { model: UserDevice, as: 'createdByDevice' },
        ],
        transaction,
      });
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
