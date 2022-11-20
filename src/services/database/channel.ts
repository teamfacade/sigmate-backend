import Channel from '../../models/Channel';
import NotFoundError from '../../utils/errors/NotFoundError';
import SequelizeError from '../../utils/errors/SequelizeError';

export const getAllChannels = async () => {
  try {
    return await Channel.findAll({
      attributes: ['discord_channel', 'twitter_channel', 'collection_id'],
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const updateChannel = async (
  collectionId: number,
  twitterChannel: string,
  discordChannel: string,
  twitterHandle: string
) => {
  try {
    const ch = await Channel.findByPk(collectionId);
    if (!ch) throw new NotFoundError('ERR_CL_NOT_FOUND');

    if (twitterChannel) {
      ch.set('twitterChannel', twitterChannel);
    }
    if (discordChannel) {
      ch.set('discordChannel', discordChannel);
    }
    if (twitterHandle) {
      ch.set('name', twitterHandle);
    }
    await ch.save();
    return ch;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
