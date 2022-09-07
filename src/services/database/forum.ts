import { ValidationError } from 'express-validator';
import { Transaction } from 'sequelize/types';
import { PaginationOptions } from '../../middlewares/handlePagination';
import db from '../../models';
import Category, { CategoryAttributes } from '../../models/Category';
import ForumComment, {
  ForumCommentAttributes,
  ForumCommentCreationAttributes,
} from '../../models/ForumComment';
import ForumPost, {
  ForumPostAttributes,
  ForumPostCreationDTO,
  ForumPostDTO,
} from '../../models/ForumPost';
import ForumPostView from '../../models/ForumPostView';
import ForumPostVote, {
  ForumPostVoteAttributes,
} from '../../models/ForumPostVote';
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
      const forumPost = await ForumPost.findByPk(forumPostId, {
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
          { model: ForumComment, limit: 10 },
        ],
        transaction,
      });
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
        { model: ForumComment, limit: 10 },
      ],
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const setForumPostCategoryIds = async (
  forumPost: ForumPost,
  categoryIds: CategoryAttributes['id'][],
  transaction: Transaction | undefined = undefined
) => {
  if (!forumPost || !categoryIds) throw new ConflictError();
  try {
    const categories = await Promise.all(
      categoryIds.map((id) => Category.findByPk(id, { transaction }))
    );

    if (categories.indexOf(null) > 0) {
      throw new ConflictError('ERR_FORUMPOST_CATEGORY_SET_NOT_EXISTS');
    }

    await forumPost.$set('categories', categories as Category[], {
      transaction,
    });
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
        setForumPostCategoryIds(fp, categories, transaction),
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

export const updateForumPost = async (
  forumPostDTO: ForumPostDTO,
  updatedBy: User,
  updatedByDevice: UserDevice
) => {
  // Final validation check
  const validationErrors: Partial<ValidationError>[] = [];
  if (!forumPostDTO.id) {
    validationErrors.push({
      param: 'id',
      value: forumPostDTO.id,
      msg: 'REQUIRED',
    });
  }

  if (!updatedBy) {
    validationErrors.push({
      param: 'updatedBy',
      value: forumPostDTO.id,
      msg: 'UNAUTHENTICATED',
    });
  }

  if (!updatedByDevice) {
    validationErrors.push({
      param: 'updatedByDevice',
      value: forumPostDTO.id,
      msg: 'INTERNAL SERVER ERROR',
    });
  }

  if (validationErrors.length) {
    throw new BadRequestError({
      clientMessage: 'ERR_DB_FORUMPOST_UPDATE_ID',
      validationErrors,
    });
  }

  try {
    const forumPostId = await db.sequelize.transaction(async (transaction) => {
      // Look for the forum post
      const fp = await ForumPost.findByPk(forumPostDTO.id, { transaction });
      if (!fp) throw new NotFoundError();
      const ps: Promise<unknown>[] = [];

      // If content is edited, record the time
      if (forumPostDTO.content) {
        forumPostDTO.contentUpdatedAt = new Date();
      }

      // Update text content
      if (forumPostDTO.title || forumPostDTO.content) {
        ps.push(
          fp.update(
            {
              title: forumPostDTO.title,
              content: forumPostDTO.content,
              contentUpdatedAt: forumPostDTO.contentUpdatedAt,
            },
            { transaction }
          )
        );
      }

      // Update categories
      if (forumPostDTO.categories) {
        ps.push(
          setForumPostCategoryIds(fp, forumPostDTO.categories, transaction)
        );
      }

      // Update tags
      if (forumPostDTO.tags) {
        ps.push(setForumPostTagNames(fp, forumPostDTO.tags, transaction));
      }

      // Set updated by
      ps.push(fp.$set('updatedBy', updatedBy, { transaction }));
      ps.push(fp.$set('updatedByDevice', updatedByDevice, { transaction }));

      // Wait for all updates to finish
      await Promise.all(ps);

      return fp.id;
    });

    return await getForumPostById(forumPostId);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const deleteForumPost = async (
  forumPostId: number,
  deletedBy: User,
  deletedByDevice: UserDevice
) => {
  try {
    return await db.sequelize.transaction(async (transaction) => {
      const fp = await ForumPost.findByPk(forumPostId, { transaction });
      if (!fp) throw new NotFoundError();
      await Promise.all([
        fp.$set('deletedBy', deletedBy, { transaction }),
        fp.$set('deletedByDevice', deletedByDevice, { transaction }),
      ]);
      return await fp.destroy({ transaction });
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getMyForumPostVote = async (
  forumPost: ForumPost,
  myself: User,
  transaction: Transaction | undefined = undefined
) => {
  try {
    if (!forumPost) throw new NotFoundError();
    const votes = await forumPost.$get('votes', {
      include: [
        {
          model: User,
          as: 'createdBy',
          where: { id: myself.id },
        },
      ],
      limit: 1,
      order: [['createdAt', 'DESC']],
      transaction,
    });
    if (votes.length === 0) return null;
    return votes[0];
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const deleteForumPostVote = async (
  v: ForumPostVote,
  deletedBy: User,
  deletedByDevice: UserDevice,
  transaction: Transaction | undefined = undefined
) => {
  try {
    let managedTx = true;
    if (!transaction) {
      transaction = await db.sequelize.transaction();
      managedTx = false;
    }
    try {
      await Promise.all([
        v.$set('deletedBy', deletedBy, { transaction }),
        v.$set('deletedByDevice', deletedByDevice, { transaction }),
        v.destroy({ transaction }),
      ]);
      if (!managedTx) transaction.commit();
    } catch (error) {
      if (!managedTx) transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const voteForumPost = async (
  forumPostId: ForumPostAttributes['id'],
  like: ForumPostVoteAttributes['like'],
  createdBy: User,
  createdByDevice: UserDevice
) => {
  try {
    return await db.sequelize.transaction(async (transaction) => {
      // Find the forum post
      const fp = await ForumPost.findByPk(forumPostId, { transaction });
      if (!fp) throw new NotFoundError();
      const ps: Promise<unknown>[] = [];

      // Have I voted before?
      const myVote = await getMyForumPostVote(fp, createdBy, transaction);
      if (myVote) {
        // If I am attempting to vote the same opinion again, stop. No need.
        if (myVote.like === like) return myVote;
        // Delete old vote
        ps.push(myVote.$set('deletedBy', createdBy, { transaction }));
        ps.push(
          myVote.$set('deletedByDevice', createdByDevice, { transaction })
        );
        ps.push(myVote.destroy({ transaction }));
      }
      // Create new vote
      const myNewVote = await ForumPostVote.create({ like }, { transaction });
      ps.push(myNewVote.$set('post', fp, { transaction }));

      // Record who voted
      ps.push(myNewVote.$set('createdBy', createdBy, { transaction }));
      ps.push(
        myNewVote.$set('createdByDevice', createdByDevice, { transaction })
      );

      await Promise.all(ps);

      return myNewVote;
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getForumPostComments = async (
  forumPost: ForumPost,
  pg: PaginationOptions
) => {
  if (!forumPost) throw new NotFoundError();
  const { limit, offset } = pg;

  try {
    return await forumPost.$get('comments', {
      include: [{ model: User, as: 'createdBy' }],
      limit,
      offset,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getForumPostCommentStats = async (c: ForumComment) => {
  if (!c) throw new NotFoundError();
  try {
    const [likeCount, dislikeCount, replyCount] = await Promise.all([
      c.$count('votes', { where: { like: true } }),
      c.$count('votes', { where: { like: false } }),
      c.$count('replies'),
    ]);
    const voteCount = likeCount - dislikeCount;
    return [voteCount, replyCount];
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getForumCommentById = async (id: ForumCommentAttributes['id']) => {
  if (!id) return null;
  try {
    return await ForumComment.findByPk(id, {
      include: [
        { model: User, as: 'createdBy' },
        {
          model: ForumComment,
          as: 'parent',
          attributes: ['id', 'content'],
          include: [{ model: User, as: 'createdBy' }],
        },
        {
          model: ForumComment,
          as: 'replies',
          attributes: ['id', 'content'],
          include: [{ model: User, as: 'createdBy' }],
          limit: 10,
        },
      ],
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createForumPostComment = async (
  fp: ForumPost,
  forumCommentCreationDTO: ForumCommentCreationAttributes,
  createdBy: User,
  createdByDevice: UserDevice
) => {
  if (!forumCommentCreationDTO.content) {
    throw new BadRequestError({
      validationErrors: [
        {
          param: 'content',
          value: forumCommentCreationDTO.content,
          msg: 'REQUIRED',
        },
      ],
    });
  }
  // Forum post not found
  if (!fp) throw new NotFoundError();

  try {
    const id = await db.sequelize.transaction(async (transaction) => {
      // Create a comment
      const c = await ForumComment.create(
        { content: forumCommentCreationDTO.content },
        { transaction }
      );

      // Is this a reply to another comment?
      let pc: ForumComment | null = null; // parent comment
      if (forumCommentCreationDTO.parentId) {
        pc = await ForumComment.findByPk(forumCommentCreationDTO.parentId, {
          transaction,
        });
        // Parent comment not found
        if (!pc) throw new NotFoundError();
      }
      const ps = [
        // promises
        c.$set('createdBy', createdBy, { transaction }), // Record who wrote the comment
        c.$set('createdByDevice', createdByDevice, { transaction }),
        fp.$add('comments', c, { transaction }), // Add the comment to the post
      ];
      if (pc) {
        // If this is a reply,
        // Connect the parent with the reply
        ps.push(c.$set('parent', pc, { transaction }));
      }
      await Promise.all(ps);

      return c.id;
    });

    return await getForumCommentById(id);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
