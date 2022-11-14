import Channel from '../../models/Channel';
import Collection from '../../models/Collection';
import SequelizeError from '../../utils/errors/SequelizeError';
import NotFoundError from '../../utils/errors/NotFoundError';
import User from '../../models/User';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';

// for admin page
export const getUnconfirmedCollections = async () => {
  try {
    return await Collection.findAll({
      attributes: ['id', 'name', 'discordUrl', 'twitterHandle'],
      where: { adminConfirmed: 0 },
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createConfirmedChannel = async (
  collectionId: number,
  discordChannel: string,
  twitterChannel: string,
  twitterHandle: string
) => {
  try {
    const [channel] = await Channel.findOrCreate({
      where: {
        collectionId: collectionId,
      },
      defaults: {
        collectionId: collectionId,
        name: twitterHandle,
        discordChannel: discordChannel,
        twitterChannel: twitterChannel,
      },
    });

    return channel;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const updateConfirmedCollection = async (
  collectionId: number,
  discordUrl: string,
  twitterHandle: string,
  user: User | undefined
) => {
  try {
    const cl = await Collection.findByPk(collectionId);
    if (!cl) throw new NotFoundError('ERR_CL_NOT_FOUND');
    if (!user) throw new UnauthenticatedError();
    return await cl.update({
      adminConfirmed: true,
      confirmedById: user.id,
      discordUrl,
      twitterHandle,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
