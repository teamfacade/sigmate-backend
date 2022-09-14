import _ from 'lodash';
import { Transaction } from 'sequelize/types';
import db from '../../../models';
import Block, {
  CollectionAttribBlockCreationDTO,
  TextBlockAuditDTO,
  TextBlockCreationDTO,
} from '../../../models/Block';
import BlockAudit from '../../../models/BlockAudit';
import NotFoundError from '../../../utils/errors/NotFoundError';
import SequelizeError from '../../../utils/errors/SequelizeError';

export const createTextBlock = async (
  blockDTO: TextBlockCreationDTO,
  transaction: Transaction | undefined = undefined
) => {
  const [b, ba] = await Promise.all([
    Block.create(
      {
        element: blockDTO.element,
        textContent: blockDTO.textContent,
        parent: blockDTO.parent,
      },
      { transaction }
    ),
    BlockAudit.create(
      {
        action: 'c', // create operation
        element: blockDTO.element,
        textContent: blockDTO.textContent,
        parentId: blockDTO.parent?.id || undefined,
      },
      { transaction }
    ),
  ]);

  const ps: Promise<unknown>[] = [
    // promises
    // Link block audit(creation) entry
    ba.$set('block', b, { transaction }),
  ];

  // Who created this block?
  blockDTO.createdByDevice &&
    ps.push(
      b.$set('createdByDevice', blockDTO.createdByDevice, { transaction })
    );
  blockDTO.createdBy &&
    ps.push(b.$set('createdBy', blockDTO.createdBy, { transaction }));

  // Link document
  blockDTO.document &&
    ps.push(b.$set('document', blockDTO.document, { transaction }));

  // Link parent block
  if (blockDTO.parent) {
    ps.push(b.$set('parent', blockDTO.parent, { transaction }));
  }
  await Promise.all(ps);

  const ret: [Block, BlockAudit] = [b, ba];
  return ret;
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
      _.pick(blockDTO, [
        'element',
        'textContent',
        'createdByDevice',
        'createdBy',
        'document',
        'style',
        'parent',
      ]),
      transaction
    );
    await Promise.all([
      block.$set('collection', blockDTO.collection, { transaction }),
      block.$set('collectionAttrib', blockDTO.collectionAttrib, {
        transaction,
      }),
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
) => {
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
        block.update(_.pick(blockDTO, ['textContent', 'element', 'style']), {
          transaction,
        })
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
        textContent: blockDTO.textContent,
        element: blockDTO.element,
        style: blockDTO.style,
        parentId: blockDTO.parent?.id || undefined,
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

    // Wait for all operations to finish
    await Promise.all(ps);

    return block;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
