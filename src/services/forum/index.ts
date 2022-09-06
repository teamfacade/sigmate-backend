import { NextFunction, Request, Response } from 'express';
import Category, {
  CategoryAttributes,
  CategoryDeleteDTO,
  CategoryResponse,
} from '../../models/Category';
import ForumPost, {
  ForumPostCreateRequestBody,
  ForumPostDTO,
  ForumPostResponse,
  ForumPostUpdateRequestBody,
} from '../../models/ForumPost';
import ApiError from '../../utils/errors/ApiError';
import BadRequestError from '../../utils/errors/BadRequestError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from '../database/category';
import {
  createForumPost,
  deleteForumPost,
  getForumPostById,
  getForumPostsByCategory,
  getForumPostVoteCount,
  getMyForumPostVote,
  updateForumPost,
  voteForumPost,
} from '../database/forum';
import { pick } from 'lodash';
import NotFoundError from '../../utils/errors/NotFoundError';
import { userPublicInfoToJSON } from '../user';
import User from '../../models/User';
import ForumPostVote, {
  ForumPostVoteResponse,
} from '../../models/ForumPostVote';

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

const forumPostToJSON = async (
  forumPost: ForumPost | null,
  myself: User | null = null
) => {
  if (!forumPost) return forumPost;
  const forumPostJSON = forumPost.toJSON();
  const forumResponse = pick(forumPostJSON, [
    'id',
    'title',
    'content',
    'comments',
    'categories',
    'tags',
    'contentUpdatedAt',
    'createdAt',
    'updatedAt',
    'createdBy',
    'updatedBy',
  ]) as ForumPostResponse;
  const createdBy = forumPost.createdBy || (await forumPost.$get('createdBy'));
  const updatedBy = forumPost.updatedBy || (await forumPost.$get('updatedBy'));
  const [viewCount, voteCount, commentCount] = await Promise.all([
    forumPost.$count('views'),
    getForumPostVoteCount(forumPost),
    forumPost.$count('comments'),
  ]);

  forumResponse.viewCount = viewCount;
  forumResponse.voteCount = voteCount;
  forumResponse.commentCount = commentCount;
  if (myself) {
    const myVote = await getMyForumPostVote(forumPost, myself);
    forumResponse.myVote = myVote ? await forumPostVoteToJSON(myVote) : null;
  } else {
    forumResponse.myVote = null;
  }
  forumResponse.createdBy = await userPublicInfoToJSON(createdBy);
  updatedBy &&
    (forumResponse.updatedBy = await userPublicInfoToJSON(updatedBy));
  return forumResponse;
};

const forumPostVoteToJSON = async (v: ForumPostVote) => {
  const vj = v.toJSON();
  const createdBy = v.createdBy || (await v.$get('createdBy'));
  const vr: ForumPostVoteResponse = {
    id: vj.id,
    like: vj.like,
    createdAt: vj.createdAt,
    createdBy: await userPublicInfoToJSON(createdBy as User),
  };
  return vr;
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

export const getForumPostsByCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId } = req.params as unknown as { categoryId: number };
    if (!categoryId) throw new BadRequestError();
    const pg = req.pg;
    if (!pg) throw new BadRequestError();
    const category = await getCategoryById(categoryId);
    if (!category) throw new NotFoundError();
    const user = req.user || null;
    const forumPostsDB = await getForumPostsByCategory(category, pg);
    const forumPosts = await Promise.all(
      forumPostsDB.map((p) => forumPostToJSON(p, user))
    );

    res.status(200).json({ success: true, forumPosts });
  } catch (error) {
    next(error);
  }
};

export const getForumPostByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const postId = req.params.postId as unknown as number;
    const forumPost = await getForumPostById(
      postId,
      true,
      req.user,
      req.device
    );
    if (!forumPost) throw new NotFoundError();
    res.status(200).json({
      success: true,
      forumPost: await forumPostToJSON(forumPost, req.user),
    });
  } catch (error) {
    next(error);
  }
};

export const createForumPostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, content, categories, tags } =
      req.body as unknown as ForumPostCreateRequestBody;
    const createdBy = req.user;
    const createdByDevice = req.device;
    if (!createdBy || !createdByDevice) throw new UnauthenticatedError();
    const forumPost = await createForumPost({
      title,
      content,
      categories,
      tags,
      createdBy,
      createdByDevice,
    });
    res.status(201).json({
      success: true,
      forumPost: await forumPostToJSON(forumPost, createdBy),
    });
  } catch (error) {
    next(error);
  }
};

export const updateForumPostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, content, categories, tags } =
      req.body as unknown as ForumPostUpdateRequestBody;

    const id = req.params.postId as unknown as number;

    const updatedBy = req.user;
    const updatedByDevice = req.device;
    if (!updatedBy || !updatedByDevice) throw new UnauthenticatedError();
    const forumPostDTO: ForumPostDTO = {
      id,
      title,
      content,
      categories,
      tags,
    };
    const forumPost = await updateForumPost(
      forumPostDTO,
      updatedBy,
      updatedByDevice
    );
    res.status(200).json({
      success: true,
      forumPost: await forumPostToJSON(forumPost, updatedBy),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteForumPostByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.postId as unknown as number;
    const deletedBy = req.user;
    const deletedByDevice = req.device;
    if (!deletedBy || !deletedByDevice) throw new UnauthenticatedError();
    await deleteForumPost(id, deletedBy, deletedByDevice);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const voteForumPostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.postId as unknown as number;
    const like = req.body.like as unknown as boolean;
    const createdBy = req.user;
    const createdByDevice = req.device;
    if (!createdBy || !createdByDevice) throw new UnauthenticatedError();

    const v = await voteForumPost(id, like, createdBy, createdByDevice);
    res
      .status(200)
      .json({ success: true, forumPostVote: await forumPostVoteToJSON(v) });
  } catch (error) {
    next(error);
  }
};
