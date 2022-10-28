import Channel from '../../models/Channel';
import Collection from '../../models/Collection';
import SequelizeError from '../../utils/errors/SequelizeError';
import Client from 'twitter-api-sdk';
import NotFoundError from '../../utils/errors/NotFoundError';

// for admin page
export const getUnconfirmedCollections = async () => {
  try {
    return await Collection.findAll({
      attributes: ['id', 'discordUrl', 'twitterHandle'],
      where: { confirmed: 0 },
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getTwitterId = async (twitterHandle: string) => {
  try {
    const client = new Client(process.env.TWITTER_BEARER_TOKEN as string);
    const twitterChannel = await client.users.findUserByUsername(twitterHandle);
    console.log(twitterChannel);
    if (!twitterChannel.data) {
      throw new NotFoundError();
    }
    return twitterChannel.data.id;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const postConfirmedCollection = async (
  collectionId: number,
  discordChannel: string,
  twitterChannel: string
) => {
  try {
    return await Channel.create({
      collectionId: collectionId,
      discordChannel: discordChannel,
      twitterChannel: twitterChannel,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
