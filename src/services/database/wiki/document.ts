import _ from 'lodash';
import { Transaction } from 'sequelize/types';
import db from '../../../models';
import { BlockRequest } from '../../../models/Block';
import Category from '../../../models/Category';
import Collection from '../../../models/Collection';
import Document, {
  DocumentAttributes,
  DocumentAuditDTO,
  DocumentCreationDTO,
  DocumentResponse,
} from '../../../models/Document';
import DocumentAudit from '../../../models/DocumentAudit';
import User from '../../../models/User';
import UserDevice from '../../../models/UserDevice';
import ApiError from '../../../utils/errors/ApiError';
import BadRequestError from '../../../utils/errors/BadRequestError';
import ConflictError from '../../../utils/errors/ConflictError';
import NotFoundError from '../../../utils/errors/NotFoundError';
import SequelizeError from '../../../utils/errors/SequelizeError';
import UnauthenticatedError from '../../../utils/errors/UnauthenticatedError';
import {
  auditBlocksInRequest,
  createNewBlocksInRequest,
  flattenBlockRequests,
  getDocumentTextContent,
  updateCreatedBlockIds,
} from '../../wiki/block';
import { updateCollectionBySlug } from '../collection';
import { grantPoints } from '../points';
import { deleteBlockById } from './block';

export const getAllBlockIdsFromDocument = async (
  document: Document,
  transaction: Transaction | undefined = undefined
) => {
  if (!document) throw new NotFoundError();
  try {
    const blocks = await document.$get('blocks', {
      attributes: ['id'],
      transaction,
    });
    const blockIds = blocks.map((block) => block.id as number);
    return blockIds;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const updateDocumentTextContent = async (
  document: Document | null,
  blocks: DocumentResponse['blocks'] | undefined
) => {
  if (!document)
    throw new ApiError('ERR_UPDATE_DOCUMENT_TEXTCONTENT_DOCUMENT_NOT_FOUND');
  if (!blocks) {
    throw new ApiError('ERR_UPDATE_DOCUMENT_TEXTCONTENT_BLOCKS_FALSY');
  }

  try {
    const textContent = getDocumentTextContent(document, blocks);
    return await document.update({ textContent });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getCollectionDocument = (cl: Collection) => {
  try {
    return cl.$get('document', { attributes: ['id', 'title'] });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getDocumentById = async (documentId: number) => {
  try {
    return await Document.findByPk(documentId);
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
      let isAudited = false;

      const doc = await Document.findByPk(documentId, {
        include: [
          { model: Document, as: 'parent', attributes: ['id'] },
          { model: Category, attributes: ['id'], through: { attributes: [] } },
        ],
        transaction,
      });

      if (!doc) {
        throw new NotFoundError('ERR_DOCUMENT_AUDIT_DOCUMENT_NOT_FOUND');
      }

      // If document title is empty, an audit request must specify a new title
      if (!doc.title && !dto.document.title) {
        throw new BadRequestError({
          validationErrors: [
            {
              location: 'body',
              param: 'document.title',
              value: dto.document.title,
              msg: 'REQUIRED',
            },
          ],
        });
      }

      // Check simple attributes to see if they actually changed
      if (dto.document.title === doc.title) {
        dto.document.title = undefined;
      }
      if (dto.document.title) {
        isAudited = true;
      }

      if (dto.document.parent === doc.parent?.id) {
        dto.document.parent = undefined;
      }

      if (dto.document.parent) {
        isAudited = true;
      }

      const documentAudit = await DocumentAudit.create({
        documentId: doc.id,
        title: dto.document.title,
        parentId: dto.document.parent,
        createdByDeviceId: updatedByDevice.id,
        createdById: updatedBy.id,
        approvedAt: new Date(),
        approvedById: updatedBy.id,
        approvedByDeviceId: updatedByDevice.id,
      });

      // Update complex parameters (Document)
      // Categories
      if (dto.document.categories) {
        // Check if anything actually changed
        const originalCategoryIds =
          doc.categories?.map((c) => c.id as number) || [];
        const xor = _.xor(dto.document.categories, originalCategoryIds);
        if (xor.length > 0) {
          isAudited = true;
          const categoryIds = dto.document.categories;
          const categoryPs = categoryIds.map((id) =>
            Category.findByPk(id, { transaction })
          );
          const categories = await Promise.all(categoryPs);
          categories.forEach((category) => {
            if (!category) {
              throw new NotFoundError('ERR_DOCUMENT_AUDIT_CATEGORY_NOT_FOUND');
            }
          });
          await doc.$set('categories', categories as Category[], {
            transaction,
          });
        }
      }

      // Update Blocks
      let flattened: BlockRequest[] = [];
      if (dto.document.blocks) {
        // TODO check if blocks actually changed

        isAudited = true;
        const blockReqs = dto.document.blocks;
        flattened = flattenBlockRequests(blockReqs);
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

        // For newly created blocks, replace the temporary Id (from frontend)
        // to the new, real Ids created in the database
        let newBlockIdDict: { [key: number]: number } = {};
        [newBlockIdDict, flattened] = updateCreatedBlockIds(
          flattened,
          createdBlocks
        );

        dto.document.blocks.forEach((block, idx) => {
          if (block.id < 0) {
            const tempId = block.id;
            const newId = newBlockIdDict[tempId];
            const dtoBlocks = dto.document.blocks as BlockRequest[];
            dtoBlocks[idx].id = newId;
          }
        });
      }

      // If blocks were updated, update the structure
      let documentStructure: number[] | undefined = dto.document.blocks?.map(
        (block) => {
          return block.id;
        }
      );

      if (_.isEqual(doc.structure, documentStructure)) {
        documentStructure = undefined;
      }
      if (documentStructure) {
        isAudited = true;
      }

      // Delete removed blocks
      const oldBlockIds = await getAllBlockIdsFromDocument(doc, transaction);
      const newBlockIds = flattened.map((blockReq) => blockReq.id);

      const blockIdsToDelete = _.difference(oldBlockIds, newBlockIds);

      for (const blockId of blockIdsToDelete) {
        await deleteBlockById(blockId, updatedBy, updatedByDevice, transaction);
      }

      // Update simple paremeters (Document)
      if (
        dto.document.title !== undefined ||
        dto.document.parent !== undefined ||
        documentStructure !== undefined
      ) {
        await doc.update(
          {
            title: dto.document.title,
            parentId: dto.document.parent,
            structure: documentStructure,
          },
          { transaction }
        );
      }

      // If structure changed, add it in the documentAudit
      if (documentStructure) {
        await documentAudit.update(
          { structure: documentStructure },
          { transaction }
        );
      }

      // Update collection information
      if (dto.collection) {
        const clEntries = Object.entries(dto.collection);
        const nonEmptyEntries = clEntries.filter((e) => Boolean(e[1]));
        if (nonEmptyEntries.length > 0) {
          isAudited = true;

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
              updatedBy,
              updatedByDevice,
            },
            documentAudit,
            transaction
          );
        }
      }

      if (!isAudited) {
        // Nothing actually changed
        throw new ConflictError();
      }

      await grantPoints({
        grantedTo: updatedBy,
        policy: 'wikiDocumentEdit',
        targetPk: doc.id,
        transaction,
      });

      return doc;
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
