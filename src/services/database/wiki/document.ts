import db from '../../../models';
import Category from '../../../models/Category';
import Collection from '../../../models/Collection';
import Document, {
  DocumentAttributes,
  DocumentAuditDTO,
  DocumentCreationDTO,
} from '../../../models/Document';
import DocumentAudit from '../../../models/DocumentAudit';
import User from '../../../models/User';
import UserDevice from '../../../models/UserDevice';
import ApiError from '../../../utils/errors/ApiError';
import BadRequestError from '../../../utils/errors/BadRequestError';
import NotFoundError from '../../../utils/errors/NotFoundError';
import SequelizeError from '../../../utils/errors/SequelizeError';
import UnauthenticatedError from '../../../utils/errors/UnauthenticatedError';
import {
  auditBlocksInRequest,
  createNewBlocksInRequest,
  flattenBlockRequests,
  updateCreatedBlockIds,
} from '../../wiki/block';
import { updateCollectionBySlug } from '../collection';

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

export const auditWikiDocumentById = async (
  documentId: DocumentAttributes['id'],
  dto: DocumentAuditDTO,
  updatedBy: User | null,
  updatedByDevice: UserDevice | null
) => {
  if (!updatedBy) throw new UnauthenticatedError();
  if (!updatedByDevice) throw new ApiError('ERR_AUDIT_DOCUMENT_DEVICE');
  try {
    return await db.sequelize.transaction(async (transaction) => {
      const doc = await Document.findByPk(documentId);
      if (!doc) throw new NotFoundError();

      const documentAudit = await DocumentAudit.create({
        documentId: doc.id,
        title: dto.document.title,
        parentId: dto.document.parent,
        createdByDeviceId: updatedByDevice.id,
        createdById: updatedBy.id,
      });

      // Update complex parameters (Document)
      // Categories
      if (dto.document.categories) {
        const categoryIds = dto.document.categories;
        const categoryPs = categoryIds.map((id) =>
          Category.findByPk(id, { transaction })
        );
        const categories = await Promise.all(categoryPs);
        categories.forEach((category) => {
          if (!category) {
            throw new NotFoundError();
          }
        });
        await doc.$set('categories', categories as Category[], { transaction });
      }

      // Update Blocks
      if (dto.document.blocks) {
        const blockReqs = dto.document.blocks;
        let flattened = flattenBlockRequests(blockReqs);
        const [createdBlocks] = await createNewBlocksInRequest(
          flattened,
          documentId,
          updatedBy,
          updatedByDevice,
          documentAudit,
          transaction
        );
        await auditBlocksInRequest(
          flattened,
          updatedBy,
          updatedByDevice,
          documentAudit,
          transaction
        );
        flattened = updateCreatedBlockIds(flattened, createdBlocks);
      }

      // If blocks were updated, update the structure
      const documentStructure = dto.document.blocks?.map((block) => block.id);

      // Update simple paremeters (Document)
      await doc.update(
        {
          title: dto.document.title,
          parentId: dto.document.parent,
          structure: documentStructure,
        },
        { transaction }
      );

      if (dto.collection) {
        // Update the collection information
        const cl = await doc.$get('collection', { transaction });

        if (!cl) {
          throw new BadRequestError({
            validationErrors: [
              {
                location: 'body',
                param: 'collection',
                msg: 'ERR_DOCUMENT_HAS_NO_COLLECTION',
              },
            ],
          });
        }

        await updateCollectionBySlug(
          cl.slug,
          {
            ...dto.collection,
            document: undefined,
          },
          documentAudit,
          transaction
        );
      }

      return doc;
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
