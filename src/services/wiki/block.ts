import _ from 'lodash';
import { Transaction } from 'sequelize/types';
import Block, {
  BlockAttributes,
  BlockRequest,
  BlockResponse,
} from '../../models/Block';
import BlockAudit from '../../models/BlockAudit';
import Document, {
  DocumentAttributes,
  DocumentResponse,
  TEXTCONTENT_SEPARATOR,
} from '../../models/Document';
import DocumentAudit from '../../models/DocumentAudit';
import User from '../../models/User';
import UserDevice from '../../models/UserDevice';
import ApiError from '../../utils/errors/ApiError';
import BadRequestError from '../../utils/errors/BadRequestError';
import NotFoundError from '../../utils/errors/NotFoundError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import {
  auditTextBlock,
  createTextBlock,
  getBlockById,
} from '../database/wiki/block';

const setBlockStructures = (
  blocks: BlockRequest[],
  parent: BlockAttributes['id'] | undefined = undefined,
  depth = 0
) => {
  return blocks?.map((block) => {
    if (parent) {
      block.parent = parent;
    }
    if (block.children) {
      block.children = setBlockStructures(block.children, block.id, depth + 1);
      block.structure = block.children.map((block) => block.id);
    }
    if (block.depth === undefined) {
      block.depth = depth;
    }
    return block;
  });
};

export const flattenBlockRequests = (blocks: BlockRequest[]) => {
  blocks = setBlockStructures(blocks);
  let flattened: BlockRequest[] = [];
  blocks.forEach((block) => {
    flattened.push({
      id: block.id,
      textContent: block.textContent,
      element: block.element,
      style: block.style,
      parent: block.parent,
      structure: block.structure,
      depth: block.depth,
    });
    if (block.children) {
      const flattenedChildren = flattenBlockRequests(block.children);
      flattened = flattened.concat(flattenedChildren);
    }
  });
  return flattened;
};

export const getBlockRequestInCreationOrder = (blocks: BlockRequest[]) => {
  const order: BlockRequest[][] = [];
  blocks.forEach((block) => {
    if (block.id < 0 && block.depth !== undefined) {
      while (order.length < block.depth + 1) {
        order.push([]);
      }
      order[block.depth].push(block);
    }
  });

  // Filter out empty arrays
  return order.filter((o) => Boolean(o.length));
};

/**
 * Create blocks that needs to be created in an array of block requests
 * @param blockReqs Flattened array of block requests
 * @param documentId ID of the document to assign the new blocks to
 * @param createdBy User
 * @param createdByDevice UserDevice
 * @returns Map of temporary blockId: real blockId
 */
export const createNewBlocksInRequest = async (
  blockReqs: BlockRequest[],
  documentId: DocumentAttributes['id'],
  createdBy: User | null,
  createdByDevice: UserDevice | null,
  documentAudit: DocumentAudit | null = null,
  transaction: Transaction | undefined = undefined
): Promise<[Block[], BlockAudit[]]> => {
  if (!createdBy) throw new UnauthenticatedError();
  if (!createdByDevice) {
    throw new ApiError('ERR_AUDIT_DOCUMENT_CREATE_BLOCKS_CREATE_DEVICE');
  }

  // Create blocks of greater depths later to prevent association errors
  const blocksToCreate = getBlockRequestInCreationOrder(blockReqs);

  // Newly created block model instances (to return)
  const createdBlocks: Block[] = [];
  const createdBlockAudits: BlockAudit[] = [];

  for (const blocks of blocksToCreate) {
    for (const block of blocks) {
      // Only create blocks for requests that have a negative ID.
      // That is, a temporary block ID provided by the frontend.
      if (block.id < 0) {
        // Element must be specified for every block. Rollback if not provided.
        if (!block.element) {
          throw new BadRequestError({
            validationErrors: [
              {
                location: 'body',
                param: 'blocks',
                msg: `BLOCK_ELEMENT_REQUIRED in Block (Block.id=${block.id})`,
              },
            ],
          });
        }

        // Create the block
        const [blk, bla] = await createTextBlock(
          {
            element: block.element,
            documentId: documentId, // Set the document ID in blocks
            style: block.style,
            textContent: block.textContent || '',
            parentId: block.parent,
            createdById: createdBy.id,
            createdByDeviceId: createdByDevice.id,
            documentAudit,
            approved: true, // TODO Prevent auto approval for newbies
          },
          transaction
        );

        // Check if everything went well
        if (!blk || !bla) {
          throw new ApiError('ERR_AUDIT_DOCUMENT_CREATE_BLOCK');
        }

        // Save the temporary blockId to the block
        blk.temporaryId = block.id;
        createdBlocks.push(blk);
        createdBlockAudits.push(bla);
      }
    }
  }
  // After creating all the blocks, return the ID map.
  return [createdBlocks, createdBlockAudits];
};

/**
 * Replace the temporary block IDs (from FE) with real IDs (from DB)
 * @param blocks Flattened array of block requests
 * @param createdBlocks Array of newly created Block objects
 */
export const updateCreatedBlockIds = (
  blocks: BlockRequest[],
  createdBlocks: Block[]
): [{ [key: number]: number }, BlockRequest[]] => {
  // Map the temporary Ids with the new ones
  const blockIdDict: { [key: number]: number } = {};
  createdBlocks.forEach((block) => {
    if (block.temporaryId) {
      blockIdDict[block.temporaryId] = block.id;
    }
  });

  const newBlocks = blocks.map((block) => ({
    ...block,
    id: block.id < 0 ? blockIdDict[block.id] : block.id,
  }));

  return [blockIdDict, newBlocks];
};

export const auditBlocksInRequest = async (
  blockReqs: BlockRequest[],
  updatedBy: User | null,
  updatedByDevice: UserDevice | null,
  documentAudit: DocumentAudit | null = null,
  transaction: Transaction | undefined = undefined
): Promise<[Block[], BlockAudit[]]> => {
  if (!updatedBy) throw new UnauthenticatedError();
  if (!updatedByDevice) {
    throw new ApiError('ERR_AUDIT_DOCUMENT_AUDIT_BLOCKS_DEVICE');
  }

  const blocks: Block[] = [];
  const blockAudits: BlockAudit[] = [];

  for (const block of blockReqs) {
    // Blocks to audit have positive integers for IDs
    if (block.id > 0) {
      // Look if the block exists
      const blk = await getBlockById(block.id, transaction);

      // If the block in question is not found, rollback and send error
      if (!blk) {
        throw new NotFoundError(
          'ERR_AUDIT_DOCUMENT_AUDIT_BLOCKS_BLOCK_NOT_FOUND'
        );
      }

      // Check for the attributes that actually changed
      if (blk.textContent === block.textContent) {
        block.textContent = undefined;
      }
      if (blk.element === block.element) {
        block.element = undefined;
      }
      if (blk.style === block.style) {
        block.style = undefined;
      }
      if (blk.parent?.id === block.parent) {
        block.parent = undefined;
      }
      if (_.isEqual(blk.structure, block.structure)) {
        block.structure = undefined;
      }

      // Do we actually need to audit this block?
      const needsAudit =
        block.textContent === undefined ||
        block.element === undefined ||
        block.style === undefined ||
        block.parent === undefined ||
        block.structure === undefined;

      if (needsAudit) {
        // If so, update the block
        const [, bla] = await auditTextBlock(
          blk,
          {
            textContent: block.textContent,
            element: block.element,
            style: block.style,
            parentId: block.parent,
            structure: block.structure,
            updatedById: updatedBy.id,
            updatedByDeviceId: updatedByDevice.id,
            documentAudit,
            approved: true, // TODO Do not approve newbies
          },
          transaction
        );

        bla && blocks.push(blk);
        bla && blockAudits.push(bla);
      }
    }
  }

  // Only the audited blocks. Later to be added to a DocumentAudit entry
  return [blocks, blockAudits];
};

/**
 * Map the blockId with the block object for quick search
 * @param blocks An array of Block model objects
 * @returns blockId mapped to the block object
 */
export const constructBlockMap = (blocks: Block[]) => {
  const blockMap: { [key: number]: Block } = {};
  blocks.forEach((block) => {
    if (block.id) {
      blockMap[block.id] = block;
    }
  });
  return blockMap;
};

/**
 * Map the blockId with the BlockResponse object for quick search
 * @param blockResponses An array of BlockResponse objects
 * @returns blockId mapped to the block object
 */
export const constructBlockResMap = (blockResponses: BlockResponse[]) => {
  const blockResMap: { [key: number]: BlockResponse } = {};
  blockResponses.forEach((blockRes) => {
    if (blockRes.id) {
      blockResMap[blockRes.id] = blockRes;
    }
  });
  return blockResMap;
};

export const getBlockTextContentFromRes = (
  block: BlockResponse | null | undefined
) => {
  if (block?.children) {
    const blockTextContents: string[] = block.children.map((block) =>
      getBlockTextContentFromRes(block)
    );
    const blockTextContent: string = blockTextContents.join(
      TEXTCONTENT_SEPARATOR
    );
    return blockTextContent;
  } else if (block?.textContent !== undefined && block?.textContent !== null) {
    return block.textContent;
  }
  return '';
};

export const getDocumentTextContent = (
  document: Document | null,
  blocks: DocumentResponse['blocks'] | undefined
) => {
  if (!document)
    throw new ApiError('ERR_GET_DOCUMENT_TEXTCONTENT_DOCUMENT_NOT_FOUND');
  if (!blocks || !blocks.length) return;

  const blockResMap = constructBlockResMap(blocks);
  const documentTextContent = document.structure
    ?.map((blockId) => getBlockTextContentFromRes(blockResMap[blockId]))
    .join(TEXTCONTENT_SEPARATOR);
  return documentTextContent;
};
