import { Transaction } from 'sequelize/types';
import WikiEngine from '.';
import Block, {
  BlockAttributes,
  TextBlockCreationDTO,
} from '../../../models/Block';
import BlockAudit, { BlockAuditAttributes } from '../../../models/BlockAudit';
import BadRequestError from '../../../utils/errors/BadRequestError';
import DatabaseEngine from '../database';

export default class WikiBlockEngine {
  wikiEngine: WikiEngine;
  dbEngine: DatabaseEngine;

  constructor(wikiEngine: WikiEngine) {
    this.wikiEngine = wikiEngine;
    this.dbEngine = wikiEngine.dbEngine;
  }

  // Block getters
  public async getBlockById(blockId: BlockAttributes['id']) {
    const { data: block } = await this.dbEngine.run(Block.findByPk(blockId));
    return block || null;
  }

  /**
   * Create BlockAudit entry for block creation action
   * @param block Created Block model object
   * @param dto Block creation DTO
   * @param transaction Transaction for creation DB actions
   * @returns Created BlockAudit entry
   */
  private async createBlockCreationAudit(
    block: Block,
    dto: TextBlockCreationDTO,
    transaction: Transaction | undefined = undefined
  ) {
    const createdById = dto.createdById || dto.createdBy?.id;
    const createdByDeviceId = dto.createdByDeviceId || dto.createdByDevice?.id;

    const bla = await BlockAudit.create(
      {
        action: 'c',
        blockId: block.id,
        element: dto.element,
        style: dto.style,
        textContent: dto.textContent,
        structure: dto.structure,
        parentId: dto.parentId || dto.parent?.id,
        documentId: dto.documentId || dto.document?.id,
        documentAuditId: dto.documentAuditId || dto.documentAudit?.id,
        approvedAt: dto.approved ? new Date() : undefined,
        approvedById: dto.approved ? createdById : undefined,
        approvedByDeviceId: dto.approved ? createdByDeviceId : undefined,
      },
      { transaction }
    );

    // Update last audit pointers for Block
    await block.update(
      {
        lastElementAuditId: dto.element !== undefined ? bla.id : undefined,
        lastStyleAuditId: dto.style !== undefined ? bla.id : undefined,
        lastTextContentAuditId:
          dto.textContent !== undefined ? bla.id : undefined,
        lastStructureAuditId: dto.structure !== undefined ? bla.id : undefined,
        lastParentAuditId:
          dto.parentId !== undefined || dto.parent !== undefined
            ? bla.id
            : undefined,
      },
      { transaction }
    );

    // Update last audit pointers for BlockAudit
    await bla.update(
      {
        lastElementAuditId: dto.element !== undefined ? bla.id : undefined,
        lastStyleAuditId: dto.style !== undefined ? bla.id : undefined,
        lastTextContentAuditId:
          dto.textContent !== undefined ? bla.id : undefined,
        lastStructureAuditId: dto.structure !== undefined ? bla.id : undefined,
        lastParentAuditId:
          dto.parentId !== undefined || dto.parent !== undefined
            ? bla.id
            : undefined,
      },
      { transaction }
    );

    return bla;
  }

  public async createBlock(dto: TextBlockCreationDTO) {
    const { data } = await this.dbEngine.run(
      this.dbEngine.sequelize.transaction(
        async (transaction): Promise<[Block, BlockAudit]> => {
          const createdById = dto.createdById || dto.createdBy?.id;
          const createdByDeviceId =
            dto.createdByDeviceId || dto.createdByDevice?.id;

          // Create block
          const blk = await Block.create(
            {
              element: dto.element,
              style: dto.style,
              textContent: dto.textContent,
              structure: dto.structure,
              parentId: dto.parentId || dto.parent?.id,
              documentId: dto.documentId || dto.document?.id,
              lastDocumentAuditId: dto.documentAuditId || dto.documentAudit?.id,
              collectionAttrib: dto.collectionAttrib,
              createdById,
              createdByDeviceId,
            },
            { transaction }
          );

          // Block Audit entry
          const bla = await this.createBlockCreationAudit(
            blk,
            dto,
            transaction
          );

          blk.temporaryId = dto.temporaryId;
          return [blk, bla];
        }
      )
    );

    return data;
  }

  public async checkAuditConflict(
    block: Block,
    lastAuditId: BlockAuditAttributes['id'] | undefined
  ) {
    if (lastAuditId) throw new BadRequestError();

    const { data: lastAuditDB } = await this.dbEngine.run(block.getLastAudit());
    const { data: lastAuditUser } = await this.dbEngine.run(
      BlockAudit.findByPk(lastAuditId)
    );

    if (lastAuditDB?.id === lastAuditUser?.id) {
      // No conflict
    } else {
      // Conflict may exist
    }
  }

  // public async auditBlock(block: Block, dto: TextBlockAuditDTO) {
  //   const conflicts = this.checkAuditConflict(block, dto.lastAuditId);
  // }
}
