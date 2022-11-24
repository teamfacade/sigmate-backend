import axios from 'axios';
import Collection from '../../models/Collection';
import Document from '../../models/Document';
import User from '../../models/User';

const WEBHOOK_URLS = {
  new_collection:
    'https://hooks.slack.com/workflows/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',
};

export const sendNewCollectionToSlack = async (collection: Collection) => {
  try {
    const cl = await collection.reload({
      attributes: ['id', 'name', 'discordUrl', 'twitterHandle', 'createdAt'],
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['userName'],
        },
        {
          model: Document,
          attributes: ['id'],
        },
      ],
    });

    if (!cl) return;
    const documentUrl = cl.document?.id
      ? `https://sigmate.io/main/wiki/${cl.document.id}`
      : '';
    const data = {
      collectionId: cl.id?.toString() || '',
      collectionName: cl.name || '',
      discordUrl: cl.discordUrl || '',
      twitterHandle: cl.twitterHandle || '',
      createdAt: cl.createdAt || '',
      createdBy: cl.createdBy?.userName || '',
      documentUrl,
    };

    await axios.post(WEBHOOK_URLS.new_collection, data);
  } catch (error) {
    return;
  }
};
