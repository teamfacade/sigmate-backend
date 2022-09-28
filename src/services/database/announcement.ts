import sequelize from 'sequelize';
import DiscordAnnouncement from '../../models/DiscordAnnouncement';
import TwitterAnnouncement from '../../models/TwitterAnnouncement';
import SequelizeError from '../../utils/errors/SequelizeError';
import mysql from 'mysql2';
import dbConfig from '../../config/dbConfig';
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

export const getAllAnnouncements = async (id: any) => {
  try {
    const pool = mysql.createPool(dbConfig.development);
    const promisePool = pool.promise();
    const union = `SELECT 'd' as opt, content, timestamp, content_id FROM sigmate_dev.discord_announcements WHERE collection_id = ${id} UNION SELECT 't' as opt, content, timestamp, content_id FROM sigmate_dev.twitter_announcements WHERE collection_id = ${id} ORDER BY timestamp DESC, content_id+0 ASC;`;
    const res = await promisePool.query(union);
    return res[0];
  } catch (err) {
    console.log(err);
  }
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
      collectionId: collectionId,
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
      collectionId: collectionId,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
