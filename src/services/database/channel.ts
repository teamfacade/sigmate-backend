import Channel from '../../models/Channel';
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
