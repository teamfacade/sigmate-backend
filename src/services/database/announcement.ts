import sequelize from 'sequelize';
import DiscordAnnouncement from '../../models/DiscordAnnouncement';
import TwitterAnnouncement from '../../models/TwitterAnnouncement';
import SequelizeError from '../../utils/errors/SequelizeError';

type DA = {
  id: string;
  content: string;
  timestamp: string;
};
type TA = {
  id: string;
  text: string;
  created_at: string;
};

export const getLatestDiscordAnnouncement = async (discordChannel: any) => {
  try {
    return await DiscordAnnouncement.findOne({
      where: { discordChannel },
      limit: 1,
      order: [[sequelize.cast(sequelize.col('contentId'), 'UNSIGNED'), 'DESC']],
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getLatestTwitterAnnouncement = async (twitterChannel: any) => {
  try {
    return await TwitterAnnouncement.findOne({
      where: { twitterChannel },
      limit: 1,
      order: [[sequelize.cast(sequelize.col('contentId'), 'UNSIGNED'), 'DESC']],
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const postDiscordAnnouncement = async (
  discordChannel: string,
  announcement: DA,
  collectionId: number
) => {
  try {
    return await DiscordAnnouncement.create({
      discordChannel: discordChannel,
      contentId: announcement.id,
      content: announcement.content,
      timestamp: announcement.timestamp,
      collection: collectionId,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const postTwitterAnnouncement = async (
  twitterChannel: string,
  announcement: TA,
  collectionId: number
) => {
  try {
    return await TwitterAnnouncement.create({
      twitterChannel: twitterChannel,
      contentId: announcement.id,
      content: announcement.text,
      timestamp: announcement.created_at,
      collection: collectionId,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
