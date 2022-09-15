import { NextFunction, Request, Response } from 'express';
import {
  getLatestDiscordAnnouncement,
  getLatestTwitterAnnouncement,
  postDiscordAnnouncement,
  postTwitterAnnouncement,
} from '../../services/database/announcement';
import { getAllChannels } from '../../services/database/channel';

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
    if (req.body.option == 'discord') {
      const latest = await getLatestDiscordAnnouncement(req.body.channel);
      res.status(200).json({
        success: true,
        latest: latest,
      });
    } else if (req.body.option == 'twitter') {
      const latest = await getLatestTwitterAnnouncement(req.body.channel);
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
