import Collection from '../../../models/Collection';
import Document, { DocumentCreationDTO } from '../../../models/Document';
import SequelizeError from '../../../utils/errors/SequelizeError';

export const getCollectionDocument = (cl: Collection) => {
  try {
    return cl.$get('document', { attributes: ['id', 'title'] });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createWikiDocument = async (dto: DocumentCreationDTO) => {
  try {
    const d = await Document.create({
      title: dto.title,
      parentId: dto.parentId || dto.parent?.id,
      collectionId: dto.collectionId || dto.collection?.id,
      nftId: dto.nftId || dto.nft?.id,
      createdByDeviceId: dto.createdByDeviceId || dto.createdByDevice?.id,
      createdById: dto.createdById || dto.createdBy?.id,
    });

    return d;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
