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

export const getConfirmedCollectionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const collections = await getConfirmedCollections();
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
    await axios.get(
      'https://frxti63hah4j7sgeq5xrhz6wvu0cccdh.lambda-url.ap-northeast-2.on.aws/'
    );
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
    await updateConfirmedCollection(
      collectionId,
      discordUrl,
      twitterHandle,
      user
    );
    const updatedChannel = await updateChannel(
      collectionId,
      twitterChannel,
      discordChannel,
      twitterHandle
    );

    res.status(200).json({
      success: true,
      channel: updatedChannel,
    });
  } catch (error) {
    next(error);
  }
};
