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
    ps.push(b.$set('lastElementAudit', ba));
    ps.push(b.$set('lastStyleAudit', ba));
    ps.push(b.$set('lastTextContentAudit', ba));
    ps.push(b.$set('lastStructureAudit', ba));
    ps.push(b.$set('lastParentAudit', ba));

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
): Promise<[Block, BlockAudit]> => {
  try {
    // Look for block
    if (!block) throw new NotFoundError();

    const u = blockDTO.updatedBy; // user
    const d = blockDTO.updatedByDevice; // device

    // Promises. Things to do
    const ps: Promise<unknown>[] = [];

    // Update the block
    if (blockDTO.textContent || blockDTO.element || blockDTO.style) {
      ps.push(
        block.update(
          _.pick(blockDTO, ['textContent', 'element', 'style', 'structure']),
          {
            transaction,
          }
        )
      );
    }
    if (blockDTO.parent) {
      // Set parent
      ps.push(block.$set('parent', blockDTO.parent, { transaction }));
    }
    u && ps.push(block.$set('updatedBy', u, { transaction }));
    d && ps.push(block.$set('updatedByDevice', d, { transaction }));

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
        // lastElementAuditId: block.lastElementAuditId,
      },
      { transaction }
    );
    ps.push(bla.$set('block', block, { transaction }));
    u && ps.push(bla.$set('createdBy', u, { transaction }));
    d && ps.push(bla.$set('createdByDevice', d, { transaction }));

    // For automatically approved block audits, set approvedBy to myself
    if (blockDTO.approved) {
      ps.push(bla.update({ approvedAt: bla.createdAt }, { transaction }));
      u && ps.push(bla.$set('approvedBy', u, { transaction }));
      d && ps.push(bla.$set('approvedByDevice', d, { transaction }));
    }

    // Update last audit pointers, if necessary
    if (blockDTO.element !== undefined) {
      ps.push(block.$set('lastElementAudit', bla, { transaction }));
    }

    if (blockDTO.style !== undefined) {
      ps.push(block.$set('lastStyleAudit', bla, { transaction }));
    }

    if (blockDTO.textContent !== undefined) {
      ps.push(block.$set('lastTextContentAudit', bla, { transaction }));
    }

    if (blockDTO.structure !== undefined) {
      ps.push(block.$set('lastStructureAudit', bla, { transaction }));
    }

    if (blockDTO.parent || blockDTO.parentId) {
      ps.push(block.$set('lastParentAudit', bla, { transaction }));
    }

    // Wait for all operations to finish
    await Promise.all(ps);

    return [block, bla];
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
