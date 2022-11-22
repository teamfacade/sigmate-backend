import { NextFunction, Request, Response } from 'express';
import { getTwitterId } from '../3p/twitter';
import {
  getUnconfirmedCollections,
  createConfirmedChannel,
  updateConfirmedCollection,
  getConfirmedCollections,
} from '../database/admin';
import { updateChannel } from '../database/channel';
import axios from 'axios';
import BadRequestError from '../../utils/errors/BadRequestError';
import { createPgRes } from '../../middlewares/handlePagination';

export const getUnconfirmedCollectionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pg = req.pg;
    if (!pg) throw new BadRequestError();
    const { rows: collections, count } = await getUnconfirmedCollections(pg);
    res.status(200).json(
      createPgRes({
        limit: pg.limit,
        offset: pg.offset,
        count,
        data: collections,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getConfirmedCollectionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pg = req.pg;
    if (!pg) throw new BadRequestError();
    const { rows: collections, count } = await getConfirmedCollections(pg);
    res.status(200).json(
      createPgRes({
        limit: pg.limit,
        offset: pg.offset,
        count,
        data: collections,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const postConfirmedCollectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { collectionId, discordUrl, discordChannel, twitterHandle } =
      req.body;
    const twitterChannel = await getTwitterId(twitterHandle);
    const channel = await createConfirmedChannel(
      collectionId,
      discordChannel,
      twitterChannel,
      twitterHandle
    );
    await updateConfirmedCollection(
      collectionId,
      discordUrl,
      twitterHandle,
      user
    );
    // execute lambda bot-server
    await axios.get(process.env.LAMBDA_BOT_URL);
    res.status(200).json({
      success: true,
      channel,
    });
  } catch (error) {
    next(error);
  }
};

export const updateConfirmedCollectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { collectionId, discordUrl, discordChannel, twitterHandle } =
      req.body;
    const twitterChannel = await getTwitterId(twitterHandle);
    const updatedChannel = await updateChannel(
      collectionId,
      twitterChannel,
      discordChannel,
      twitterHandle
    );
    await updateConfirmedCollection(
      collectionId,
      discordUrl,
      twitterHandle,
      user
    );
    // execute lambda bot-server
    await axios.get(process.env.LAMBDA_BOT_URL);
    res.status(200).json({
      success: true,
      channel: updatedChannel,
    });
  } catch (error) {
    next(error);
  }
};
