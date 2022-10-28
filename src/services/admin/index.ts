import { NextFunction, Request, Response } from 'express';
import {
  getTwitterId,
  getUnconfirmedCollections,
  postConfirmedCollection,
} from '../database/admin';

export const getUnconfirmedCollectionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const collections = await getUnconfirmedCollections();
    res.status(200).json({
      success: true,
      collections,
    });
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
    const { collectionId, discordChannel, twitterHandle } = req.body;
    const twitterChannel = await getTwitterId(twitterHandle);
    const channel = await postConfirmedCollection(
      collectionId,
      discordChannel,
      twitterChannel
    );
    res.status(200).json({
      success: true,
      channel,
    });
  } catch (error) {
    next(error);
  }
};
