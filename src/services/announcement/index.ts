import { NextFunction, Request, Response } from 'express';
import {
  createPgRes,
  PaginationOptions,
} from '../../middlewares/handlePagination';
import {
  getAllAnnouncements,
  getLatestDiscordAnnouncement,
  getLatestTwitterAnnouncement,
  postDiscordAnnouncement,
  postTwitterAnnouncement,
} from '../../services/database/announcement';
import { getAllChannels } from '../../services/database/channel';

export const getAllAnnouncementsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit, offset } = req.pg as PaginationOptions;
    const cid = req.query.cid as unknown as number;
    const anns = await getAllAnnouncements(cid, limit, offset);

    const response = createPgRes<typeof anns>({
      limit,
      offset,
      count: 0,
      data: anns,
    });
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getAllChannelsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const channels = await getAllChannels();
    res.status(200).json({
      success: true,
      channels: channels,
    });
  } catch (error) {
    next(error);
  }
};

export const getLatestAnnouncementController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.query.option == 'discord') {
      const latest = await getLatestDiscordAnnouncement(req.query.channel);
      res.status(200).json({
        success: true,
        latest: latest,
      });
    } else if (req.query.option == 'twitter') {
      const latest = await getLatestTwitterAnnouncement(req.query.channel);
      res.status(200).json({
        success: true,
        latest: latest,
      });
    } else {
      res.status(400).send();
    }
  } catch (error) {
    next(error);
  }
};

export const postAnnouncementController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.body.option == 'discord') {
      const { discordChannel, announcement, collectionId } = req.body;
      await postDiscordAnnouncement(discordChannel, announcement, collectionId);
      res.status(200).json({
        success: true,
      });
    } else if (req.body.option == 'twitter') {
      const { twitterChannel, announcement, collectionId } = req.body;
      await postTwitterAnnouncement(twitterChannel, announcement, collectionId);
      res.status(200).json({
        success: true,
      });
    } else {
      res.status(400).send();
    }
  } catch (error) {
    next(error);
  }
};
