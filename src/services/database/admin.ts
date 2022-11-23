import Channel from '../../models/Channel';
import Collection from '../../models/Collection';
import SequelizeError from '../../utils/errors/SequelizeError';
import NotFoundError from '../../utils/errors/NotFoundError';
import User from '../../models/User';
import UserDevice from '../../models/UserDevice';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import ApiError from '../../utils/errors/ApiError';
import { UpdateCollectionReqBody } from '../../services/wiki/collection';
import {
  getCollectionBySlug,
  updateCollectionBySlugWithTx,
} from './collection';
import { auditWikiDocumentById } from './wiki/document';
import { PaginationOptions } from '../../middlewares/handlePagination';

// for admin page - channel
export const getUnconfirmedCollections = async (pg: PaginationOptions) => {
  try {
    return await Collection.findAndCountAll({
      attributes: ['id', 'name', 'discordUrl', 'twitterHandle'],
      where: { adminConfirmed: 0 },
      limit: pg.limit,
      offset: pg.offset,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getConfirmedCollections = async (pg: PaginationOptions) => {
  try {
    return await Collection.findAndCountAll({
      attributes: ['id', 'name', 'discordUrl', 'twitterHandle'],
      where: { adminConfirmed: 1 },
      limit: pg.limit,
      offset: pg.offset,
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
  user: User | undefined,
  device: UserDevice | undefined
) => {
  try {
    const cl = await Collection.findByPk(collectionId, {
      attributes: ['id', 'slug'],
    });
    if (!cl) throw new NotFoundError('ERR_CL_NOT_FOUND');
    if (!user) throw new UnauthenticatedError();

    return await updateCollectionBySlugWithTx(cl.slug, {
      adminConfirmed: true,
      adminConfirmedById: user.id,
      discordUrl,
      twitterHandle,
      updatedBy: user,
      updatedByDevice: device,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const updateUserSourceCollection = async (
  collectionSlug: string,
  collectionDTO: UpdateCollectionReqBody,
  user: User | undefined,
  device: UserDevice | undefined
) => {
  try {
    const cl = await getCollectionBySlug(collectionSlug);
    if (!cl) throw new NotFoundError('ERR_CL_NOT_FOUND');
    if (!user) throw new UnauthenticatedError();
    if (!device) throw new ApiError('ERR_DEVICE');

    const document = await cl.$get('document', { attributes: ['id'] });
    if (!document) throw new NotFoundError('ERR_DOCUMENT_NOT_FOUND');

    //document audit
    await auditWikiDocumentById(
      document.id,
      {
        document: {},
        collection: {
          ...collectionDTO,
          infoSource: 'admin',
          infoConfirmedById: user.id,
        },
      },
      user,
      device
    );

    return cl;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
