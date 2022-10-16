import _ from 'lodash';
import { Transaction } from 'sequelize/types';
import db from '../../../models';
import Block, {
  BlockAttributes,
  CollectionAttribBlockCreationDTO,
  CollectionAttribBlockDeletionDTO,
  TextBlockAuditDTO,
  TextBlockCreationDTO,
} from '../../../models/Block';
import BlockAudit from '../../../models/BlockAudit';
import Collection from '../../../models/Collection';
import User from '../../../models/User';
import UserDevice from '../../../models/UserDevice';
import ApiError from '../../../utils/errors/ApiError';
import ConflictError from '../../../utils/errors/ConflictError';
import NotFoundError from '../../../utils/errors/NotFoundError';
import SequelizeError from '../../../utils/errors/SequelizeError';
import UnauthenticatedError from '../../../utils/errors/UnauthenticatedError';

export const getBlockById = async (
  id: BlockAttributes['id'],
  transaction: Transaction | undefined = undefined
) => {
  try {
    return await Block.findByPk(id, { transaction });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createTextBlock = async (
  blockDTO: TextBlockCreationDTO,
  transaction: Transaction | undefined = undefined
): Promise<[Block, BlockAudit]> => {
  const userId = blockDTO.createdById || blockDTO.createdBy?.id;
  const userDeviceId =
    blockDTO.createdByDeviceId || blockDTO.createdByDevice?.id;

  if (!userId) throw new UnauthenticatedError();
  if (!userDeviceId) throw new ApiError('ERR_CREATE_BLOCK_DEVICE');

  try {
    const b = await Block.create(
      {
        element: blockDTO.element,
        textContent: blockDTO.textContent,
        documentId: blockDTO.documentId || blockDTO.document?.id,
        parentId: blockDTO.parentId || blockDTO.parent?.id,
        lastDocumentAuditId:
          blockDTO.documentAuditId || blockDTO.documentAudit?.id,
        collectionAttrib: blockDTO.collectionAttrib,
        createdById: userId,
        createdByDeviceId: userDeviceId,
      },
      { transaction }
    );

    const ba = await BlockAudit.create(
      {
        action: 'c', // create operation
        element: blockDTO.element,
        textContent: blockDTO.textContent,
        parentId: blockDTO.parentId || blockDTO.parent?.id,
        documentId: blockDTO.documentId || blockDTO.document?.id,
        documentAuditId: blockDTO.documentAuditId || blockDTO.documentAudit?.id,
        createdById: userId,
        createdByDeviceId: userDeviceId,
        approvedAt: blockDTO.approved ? new Date() : undefined,
        approvedById: blockDTO.approved ? userId : undefined,
        approvedByDeviceId: blockDTO.approved ? userDeviceId : undefined,
      },
      { transaction }
    );

    await b.update(
      {
        lastElementAuditId: ba.id,
        lastStyleAuditId: ba.id,
        lastTextContentAuditId: ba.id,
        lastStructureAuditId: ba.id,
        lastParentAuditId: ba.id,
      },
      { transaction }
    );

    await ba.update(
      {
        blockId: b.id,
      },
      { transaction }
    );

    return [b, ba];
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createTextBlockWithTx = async (blockDTO: TextBlockCreationDTO) => {
  try {
    return await db.sequelize.transaction(async (transaction) => {
      return await createTextBlock(blockDTO, transaction);
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createCollectionAttribBlock = async (
  blockDTO: CollectionAttribBlockCreationDTO,
  transaction: Transaction | undefined = undefined
) => {
  const userId = blockDTO.createdById || blockDTO.createdBy?.id;
  const userDeviceId =
    blockDTO.createdByDeviceId || blockDTO.createdByDevice?.id;

  if (!userId) throw new UnauthenticatedError();
  if (!userDeviceId) throw new ApiError('ERR_CREATE_COLLECTION_BLOCK_DEVICE');
  try {
    const [block] = await createTextBlock(
      {
        element: blockDTO.element,
        textContent: blockDTO.textContent,
        collectionAttrib: blockDTO.collectionAttrib,
        collectionId: blockDTO.collection?.id,
        createdByDeviceId: userDeviceId,
        createdById: userId,
        document: blockDTO.document,
        style: blockDTO.style,
        parent: blockDTO.parent,
        approved: true,
      },
      transaction
    );
    await Promise.all([
      block.$set('collection', blockDTO.collection, { transaction }),
    ]);
    return block;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const auditTextBlock = async (
  block: Block | null,
  blockDTO: TextBlockAuditDTO,
  transaction: Transaction | undefined = undefined
): Promise<[Block, BlockAudit | null]> => {
  try {
    // Look for block
    if (!block) throw new NotFoundError();

    const userId = blockDTO.updatedById || blockDTO.updatedBy?.id;
    const userDeviceId =
      blockDTO.updatedByDeviceId || blockDTO.updatedByDevice?.id;

    if (!userId) throw new UnauthenticatedError();
    if (!userDeviceId) throw new ApiError('ERR_AUDIT_BLOCK_DEVICE');

    let isAudited = false;

    // Check if the block actually changed
    if (block.textContent === blockDTO.textContent) {
      blockDTO.textContent = undefined;
    }

    if (blockDTO.textContent) {
      isAudited = true;
    }

    if (block.element === blockDTO.element) {
      blockDTO.element = undefined;
    }

    if (blockDTO.element) {
      isAudited = true;
    }

    if (block.style === blockDTO.style) {
      blockDTO.style = undefined;
    }

    if (blockDTO.style) {
      isAudited = true;
    }

    if (_.isEqual(block.structure, blockDTO.structure)) {
      blockDTO.structure = undefined;
    }

    if (blockDTO.structure) {
      isAudited = true;
    }

    if (blockDTO.parentId !== undefined || blockDTO.parent) {
      const oldParent =
        block.parent || (await block.$get('parent', { attributes: ['id'] }));
      const oldParentId = oldParent?.id;
      const newParentId = blockDTO.parentId || blockDTO.parent?.id;

      if (oldParentId === newParentId) {
        blockDTO.parentId = undefined;
        blockDTO.parent = undefined;
      }
    }

    if (blockDTO.parent || blockDTO.parentId) {
      isAudited = true;
    }

    // Nothing actually changed. No need to audit
    if (!isAudited) {
      return [block, null];
    }

    // Update the block
    await block.update(
      {
        textContent: blockDTO.textContent,
        element: blockDTO.element,
        style: blockDTO.style,
        structure: blockDTO.structure,
        parentId: blockDTO.parentId || blockDTO.parent?.id,
        updatedById: userId,
        updatedByDeviceId: userDeviceId,
      },
      { transaction }
    );

    // Create new audit entry
    const bla = await BlockAudit.create(
      {
        action: 'u', // UPDATE
        textContent: blockDTO.textContent,
        element: blockDTO.element,
        style: blockDTO.style,
        structure: blockDTO.structure,
        documentAuditId: blockDTO.documentAuditId || blockDTO.documentAudit?.id,
        parentId: blockDTO.parent?.id || undefined,
        blockId: block.id,
        createdById: userId,
        createdByDeviceId: userDeviceId,
        approvedAt: blockDTO.approved ? new Date() : undefined,
        approvedById: blockDTO.approved ? userId : undefined,
        approvedByDeviceId: blockDTO.approved ? userDeviceId : undefined,
      },
      { transaction }
    );

    // Update last audit pointers, if necessary
    await block.update(
      {
        lastElementAuditId: blockDTO.element !== undefined ? bla.id : undefined,
        lastStyleAuditId: blockDTO.style !== undefined ? bla.id : undefined,
        lastTextContentAuditId:
          blockDTO.textContent !== undefined ? bla.id : undefined,
        lastStructureAuditId:
          blockDTO.structure !== undefined ? bla.id : undefined,
        lastParentAuditId:
          blockDTO.parent || blockDTO.parentId ? bla.id : undefined,
      },
      { transaction }
    );

    return [block, bla];
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const auditTextBlockWithTx = async (
  block: Block | null,
  blockDTO: TextBlockAuditDTO
): Promise<[Block, BlockAudit | null]> => {
  try {
    return await db.sequelize.transaction(async (transaction) => {
      return await auditTextBlock(block, blockDTO, transaction);
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const deleteCollectionAttribBlocks = async (
  collection: Collection,
  dto: CollectionAttribBlockDeletionDTO,
  transaction: Transaction | undefined = undefined
) => {
  try {
    const blocks =
      collection.blocks ||
      (await collection.$get('blocks', { transaction })) ||
      [];
    const u = dto.deletedBy;
    const d = dto.deletedByDevice;
    if (u) {
      await Promise.all(
        blocks.map((b) => b.$set('deletedBy', u, { transaction }))
      );
    }
    if (d) {
      await Promise.all(
        blocks.map((b) => b.$set('deletedByDevice', d, { transaction }))
      );
    }
    await Promise.all(
      blocks.map((b) =>
        BlockAudit.create(
          {
            action: 'd',
            blockId: b.id,
            createdByDeviceId: d?.id,
            createdById: u?.id,
            approvedByDeviceId: d?.id,
            approvedById: u?.id,
            approvedAt: new Date(),
          },
          { transaction }
        )
      )
    );

    if (!collection.id) throw new ConflictError();
    await Block.destroy({
      where: { collectionId: collection.id },
      transaction,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const deleteBlockById = async (
  blockId: BlockAttributes['id'],
  deletedBy: User | null,
  deletedByDevice: UserDevice | null,
  transaction: Transaction | undefined = undefined
) => {
  try {
    // Check if the block exists
    const block = await Block.findByPk(blockId, { transaction });
    if (!block) throw new NotFoundError();

    // Mark who deleted the block
    await block.update(
      {
        deletedByDeviceId: deletedByDevice?.id,
        deletedById: deletedBy?.id,
      },
      { transaction }
    );

    // Create audit entry for deletion
    await BlockAudit.create(
      {
        action: 'd',
        blockId: block.id,
        createdByDeviceId: deletedByDevice?.id,
        createdByDevice: deletedBy?.id,
        // TODO Beta: Auto approval of deletion
        approvedByDevice: deletedByDevice?.id,
        approvedBy: deletedBy?.id,
        approvedAt: new Date(),
      },
      { transaction }
    );

    // Actually delete the block
    await block.destroy({ transaction });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
