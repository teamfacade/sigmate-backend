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
import ConflictError from '../../../utils/errors/ConflictError';
import NotFoundError from '../../../utils/errors/NotFoundError';
import SequelizeError from '../../../utils/errors/SequelizeError';

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
) => {
  try {
    const [b, ba] = await Promise.all([
      Block.create(
        {
          element: blockDTO.element,
          textContent: blockDTO.textContent,
          documentId: blockDTO.documentId || blockDTO.document?.id,
          parentId: blockDTO.parentId || blockDTO.parent?.id,
          lastDocumentAuditId:
            blockDTO.documentAuditId || blockDTO.documentAudit?.id,
          collectionAttrib: blockDTO.collectionAttrib,
        },
        { transaction }
      ),
      BlockAudit.create(
        {
          action: 'c', // create operation
          element: blockDTO.element,
          textContent: blockDTO.textContent,
          parentId: blockDTO.parentId || blockDTO.parent?.id,
          documentAuditId:
            blockDTO.documentAuditId || blockDTO.documentAudit?.id,
          approvedAt: blockDTO.approved ? new Date() : undefined,
        },
        { transaction }
      ),
    ]);

    const ps: Promise<unknown>[] = [
      // promises
      // Link block audit(creation) entry
      ba.$set('block', b, { transaction }),
    ];

    const d = blockDTO.createdByDevice;
    const u = blockDTO.createdBy;

    // Who created this block?
    u && ps.push(b.$set('createdBy', u, { transaction }));
    d && ps.push(b.$set('createdByDevice', d, { transaction }));

    // Who created this block audit?
    u && ps.push(ba.$set('createdBy', u, { transaction }));
    d && ps.push(ba.$set('createdByDevice', d, { transaction }));
    if (blockDTO.approved) {
      u && ps.push(ba.$set('approvedBy', u, { transaction }));
      d && ps.push(ba.$set('approvedByDevice', d, { transaction }));
    }

    // Link document
    blockDTO.document &&
      ps.push(b.$set('document', blockDTO.document, { transaction }));

    // Link parent block
    if (blockDTO.parent) {
      ps.push(b.$set('parent', blockDTO.parent, { transaction }));
    }

    // Link last audit pointers
    ps.push(b.$set('lastElementAudit', ba, { transaction }));
    ps.push(b.$set('lastStyleAudit', ba, { transaction }));
    ps.push(b.$set('lastTextContentAudit', ba, { transaction }));
    ps.push(b.$set('lastStructureAudit', ba, { transaction }));
    ps.push(b.$set('lastParentAudit', ba, { transaction }));

    await Promise.all(ps);

    const ret: [Block, BlockAudit] = [b, ba];
    return ret;
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
  try {
    const [block] = await createTextBlock(
      {
        element: blockDTO.element,
        textContent: blockDTO.textContent,
        collectionAttrib: blockDTO.collectionAttrib,
        createdByDevice: blockDTO.createdByDevice,
        createdBy: blockDTO.createdBy,
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

    const u = blockDTO.updatedBy; // user
    const d = blockDTO.updatedByDevice; // device

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
    block.update(
      {
        textContent: blockDTO.textContent,
        element: blockDTO.element,
        style: blockDTO.style,
        structure: blockDTO.structure,
        parentId: blockDTO.parentId || blockDTO.parent?.id,
        updatedById: u?.id,
        updatedByDeviceId: d?.id,
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
        createdById: u?.id,
        createdByDeviceId: d?.id,
      },
      { transaction }
    );

    // For automatically approved block audits, set approvedBy to myself
    if (blockDTO.approved) {
      await bla.update(
        {
          approvedAt: bla.createdAt,
          approvedById: u?.id,
          approvedByDeviceId: d?.id,
        },
        { transaction }
      );
    }

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
