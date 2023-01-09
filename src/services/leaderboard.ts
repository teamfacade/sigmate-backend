import { Request, Response, NextFunction } from 'express';
import {
  createPgRes,
  PaginationOptions,
} from '../middlewares/handlePagination';
import { UserPublicResponse } from '../models/User';
import BadRequestError from '../utils/errors/BadRequestError';
import SequelizeError from '../utils/errors/SequelizeError';
import UnauthenticatedError from '../utils/errors/UnauthenticatedError';
import {
  getLeaderboard,
  getMyLeaderboard,
  LeaderboardQueryRow,
} from './database/leaderboard';
import { findUserById } from './database/user';
import { userPublicInfoToJSON } from './user';

export type LeaderboardModel = {
  rank: number;
  grantedToId: number;
  user: UserPublicResponse | null;
  referral: number;
  forum: {
    postCreate: number;
    commentCreate: number;
  };
  wiki: {
    documentEdit: number;
  };
  total: number;
};

export const buildLeaderboardModels = async (
  rows: object[],
  options: { skipUser?: boolean; pg?: PaginationOptions } = {}
) => {
  const models: LeaderboardModel[] = [];
  for (let i = 0; i < rows.length; i++) {
    const {
      total: totalStr,
      subtotal,
      grantedToId,
      policyName,
    } = rows[i] as LeaderboardQueryRow;
    const total = Number.parseInt(totalStr);
    if (!grantedToId || !subtotal || !policyName) continue;

    if (
      models.length === 0 ||
      models[models.length - 1].grantedToId !== grantedToId
    ) {
      // User
      try {
        let userRes: UserPublicResponse | null = null;
        if (!options.skipUser) {
          const user = await findUserById(grantedToId);
          userRes = user ? await userPublicInfoToJSON(user) : null;
        }
        const offset = options.pg?.offset || 0;
        models.push({
          rank: offset + models.length + 1,
          grantedToId,
          user: userRes,
          referral: 0,
          forum: {
            postCreate: 0,
            commentCreate: 0,
          },
          wiki: {
            documentEdit: 0,
          },
          total: total || 0,
        });
      } catch (error) {
        throw new SequelizeError(error as Error);
      }
    }

    const model = models[models.length - 1];
    const points = Number.parseInt(subtotal);
    switch (policyName) {
      case 'forumPostCreate':
        model.forum.postCreate = points;
        break;
      case 'forumPostCommentCreate':
        model.forum.commentCreate = points;
        break;
      case 'referral':
        model.referral = points;
        break;
      case 'wikiDocumentEdit':
        model.wiki.documentEdit = points;
        break;
      default:
        throw new Error(`Unexpected UserPointPolicy name: ${policyName}`);
    }

    if (total !== model.total) {
      model.total += points;
    }
  }
  return models;
};

export const getLeaderboardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pg = req.pg;
    if (!pg) throw new BadRequestError();
    const leaderboard = await getLeaderboard(pg);
    const response = createPgRes({
      limit: pg.limit,
      offset: pg.offset,
      count: leaderboard.length,
      data: leaderboard,
    });
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getMyLeaderboardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) throw new UnauthenticatedError();
    const myLeaderboard = await getMyLeaderboard(user);
    if (myLeaderboard.length) {
      res.status(200).json({ success: true, leaderboard: myLeaderboard[0] });
    } else {
      res.status(200).json({ success: true, leaderboard: null });
    }
  } catch (error) {
    next(error);
  }
};
