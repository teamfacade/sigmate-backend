import Client from 'twitter-api-sdk';
import NotFoundError from '../../utils/errors/NotFoundError';
import ApiError from '../../utils/errors/ApiError';

export const getTwitterId = async (twitterHandle: string) => {
  try {
    const client = new Client(process.env.TWITTER_BEARER_TOKEN);
    const twitterChannel = await client.users.findUserByUsername(twitterHandle);
    if (!twitterChannel.data) {
      throw new NotFoundError();
    }
    return twitterChannel.data.id;
  } catch (error) {
    throw new ApiError('ERR_TWITTER_API');
  }
};
