import { isEqual, mapValues } from 'lodash';
import WikiDiffError from '../../errors/wiki/diff';

type AuditAction = sigmate.Wiki.AuditAction | null | undefined;
type BlockItemAttribs = sigmate.Wiki.BlockItemAttribs;
type BlockItemUAttribs = sigmate.Wiki.BlockItemUAttribs;
type DiffResult<T, A = AuditAction | null | undefined> = { data: T; action: A };

/**
 * Process a validated user request and produce a wiki block item
 */
export default class WikiDiff {
  public static checkBlockIdMatch(
    after: BlockItemAttribs['id'],
    before: BlockItemAttribs['id']
  ) {
    if (after !== before) {
      throw new WikiDiffError({
        code: 'WIKI/DIFF/ER_ID_MISMATCH',
        message: `after: ${after}, before: ${before}`,
      });
    }
  }

  public static compareType(
    after: BlockItemAttribs['type'] | undefined,
    before: BlockItemAttribs['type']
  ): DiffResult<BlockItemAttribs['type']> {
    if (after === undefined) {
      return {
        data: before,
        action: null,
      };
    } else {
      return {
        data: after,
        action: before === after ? null : 'update',
      };
    }
  }

  public static compareData(
    after: BlockItemAttribs['data'] | undefined,
    before: BlockItemAttribs['data']
  ): DiffResult<BlockItemAttribs['data']> {
    if (after === undefined) {
      return {
        data: before,
        action: null,
      };
    } else {
      return {
        data: after,
        action: isEqual(before, after) ? null : 'update',
      };
    }
  }

  public static compareKeyInfo(
    after: BlockItemAttribs['keyInfo'],
    before: BlockItemAttribs['keyInfo']
  ): DiffResult<BlockItemAttribs['keyInfo']> {
    if (after === undefined) {
      return {
        data: before,
        action: null,
      };
    } else {
      if (after.name !== before?.name) {
        throw new WikiDiffError('WIKI/DIFF/RJ_KI_NAME');
      }
      return {
        data: after,
        action: after.label === before.label ? null : 'update',
      };
    }
  }

  public static compareExt(
    after: BlockItemUAttribs['external'] | null,
    before: BlockItemAttribs['external']
  ): DiffResult<
    BlockItemAttribs['external'],
    sigmate.Wiki.BlockAttribActions['ext']
  > {
    if (after === undefined) {
      return { data: before, action: mapValues(before, () => null) };
    } else if (after === null) {
      let action: sigmate.Wiki.BlockAttribActions['ext'];
      if (before) {
        action = mapValues(before, () => 'delete');
      } else {
        action = undefined;
      }
      return { data: undefined, action };
    } else {
      const action: sigmate.Wiki.BlockAttribActions['ext'] = {};
      if (before) {
        Object.keys(after).forEach((k) => {
          action[k] = k in before ? null : 'create';
        });
        Object.keys(before).forEach((k) => {
          if (!(k in after)) action[k] = 'delete';
        });
      } else {
        Object.keys(after).forEach((k) => {
          action[k] = 'create';
        });
      }
      return {
        data: mapValues(after, (v) =>
          v === null ? { cache: null, cachedAt: null } : v
        ),
        action,
      };
    }
  }
}

// import { isEqual } from 'lodash';
// import WikiBlockError from '../../errors/wiki/block';
// import Droplet from '../../utils/droplet';

// export default class WikiDiff {
//   /**
//    * Generates DynamoDB block version items for `update` operations
//    * - Version ID are automatically generated.
//    * - External data is **not** fetched (should be done elsewhere)
//    * @param next Data for the newly created version
//    * @param prev Data of the previous version
//    * @returns Block DTO of the new version
//    */
//   public static generateUpdatedBlock(
//     next: UpdateBlockDTO,
//     prev: BlockDTO
//   ): GenerateBlockDTO {
//     // New data from the user
//     const {
//       id,
//       type,
//       data,
//       keyInfo,
//       external,
//       document,
//       documentVersion,
//       updatedById,
//     } = next;

//     const version = Droplet.generate();

//     // Check what has changed
//     const typeHistory = this.getTypeHistory(type, prev.type);
//     const dataHistory = this.getDataHistory(data, prev.data);
//     const kiHistory = this.getKIHistory(keyInfo, prev.keyInfo);
//     const extHistory = this.getExtHistory(external, prev.external);

//     // Reset verification count on version increase
//     const verificationCount: GenerateBlockDTO['verificationCount'] = {
//       verify: 0,
//       beAware: 0,
//     };

//     // Build a new version
//     return {
//       id,
//       type: typeHistory.data,
//       data: dataHistory.data,
//       keyInfo: kiHistory.data,
//       external: extHistory.data,
//       version,
//       document,
//       documentVersion,
//       blockAction: 'update',
//       attribActions: {
//         Type: typeHistory.action,
//         Data: dataHistory.action,
//         Ext: extHistory.action,
//         KeyInfo: kiHistory.action,
//       },
//       updatedById,
//       verificationCount,
//       schema: 1,
//     };
//   }

//   /**
//    * Generate a DynamoDB item object for a newly created block.
//    * - Block ID and version ID are automatically generated.
//    * - External data is **not** fetched (should be done elsewhere)
//    * @param dto Block data
//    * @returns Data of the new block
//    */
//   public static generateCreatedBlock(dto: CreateBlockDTO): GenerateBlockDTO {
//     const {
//       type,
//       data,
//       keyInfo,
//       external,
//       document,
//       documentVersion,
//       updatedById,
//       createdById,
//     } = dto;

//     const id = Droplet.generate();
//     const version = Droplet.generate();

//     // The block is new. So all external data is a 'create' operation
//     const extActions: BlockDTO['attribActions']['Ext'] = {};
//     if (external) {
//       Object.keys(external).forEach((k) => (extActions[k] = 'create'));
//     }

//     return {
//       id,
//       type,
//       data,
//       keyInfo,
//       external,
//       version,
//       document,
//       documentVersion,
//       blockAction: 'create',
//       attribActions: {
//         Type: 'create',
//         Data: 'create',
//         Ext:
//           external && Object.keys(external).length > 0 ? extActions : undefined,
//         KeyInfo: keyInfo?.label ? { label: 'create' } : undefined,
//       },
//       updatedById: updatedById,
//       createdById: createdById,
//       verificationCount: {
//         verify: 0,
//         beAware: 0,
//       },
//       schema: 1,
//     };
//   }

//   /**
//    * Generate a new `type` attribute of a new block version, for block audit operations
//    * @param after Data for next block version
//    * @param before Data of previous block version
//    * @returns `type` attribute to replace the old version with, and the type of audit action
//    */
//   public static getTypeHistory(
//     after: BlockDTO['type'] | undefined,
//     before: BlockDTO['type']
//   ): ObjectHistory<BlockDTO['type']> {
//     if (after === undefined) {
//       // No change
//       return {
//         data: before,
//         action: null,
//       };
//     } else {
//       // Update or no change
//       return {
//         data: after,
//         action: after === before ? null : 'update',
//       };
//     }
//   }

//   /**
//    * Generate a new `data` attribute of a new block version, for block audit operations
//    * @param after Data for next block version
//    * @param before Data of previous block version
//    * @returns `data` attribute to replace the old version with, and the type of audit action
//    */
//   public static getDataHistory(
//     after: BlockDTO['data'] | undefined,
//     before: BlockDTO['data']
//   ): ObjectHistory<BlockDTO['data']> {
//     if (after === null) {
//       // delete
//       return {
//         data: after,
//         action: 'delete',
//       };
//     } else if (after === undefined) {
//       // No change
//       return {
//         data: before,
//         action: null,
//       };
//     } else {
//       // check
//       return {
//         data: after,
//         action: isEqual(before, after) ? null : 'update',
//       };
//     }
//   }

//   /**
//    * Generate a new `keyInfo` attribute of a new block version, for block audit operations
//    * @param after Data for next block version
//    * @param before Data of previous block version
//    * @returns `keyInfo` attribute to replace the old version with, and the type of audit action
//    */
//   public static getKIHistory(
//     after: BlockDTO['keyInfo'],
//     before: BlockDTO['keyInfo']
//   ): ObjectHistory<BlockDTO['keyInfo'], BlockAttribActions['KeyInfo']> {
//     if (after === undefined) {
//       // no change
//       return {
//         data: before,
//         action: before ? null : undefined,
//       };
//     } else {
//       // check
//       if (after.name !== before?.name) {
//         throw new WikiBlockError('WIKI/BLOCK/IV_KI_NAME_CHANGE');
//       }
//       return {
//         data: after,
//         action: {
//           label:
//             after.label === before.label
//               ? null
//               : before.label
//               ? 'update'
//               : 'create',
//         },
//       };
//     }
//   }

//   /**
//    * Generate a new `external` attribute of a new block version, for block audit operations
//    * @param after Data for next block version
//    * @param before Data of previous block version
//    * @returns `external` attribute to replace the old version with, and the type of audit action
//    */
//   public static getExtHistory(
//     after: BlockDTO['external'] | null,
//     before: BlockDTO['external']
//   ): ObjectHistory<BlockDTO['external'], BlockAttribActions['Ext']> {
//     if (after === undefined) {
//       // no change
//       return { data: before, action: null };
//     } else if (after === null) {
//       // delete
//       const action: Record<string, AuditAction | null> = {};
//       if (before) {
//         Object.keys(before).forEach((k) => {
//           action[k] = 'delete';
//         });
//       }
//       return { data: undefined, action: before ? action : null };
//     } else {
//       const action: Record<string, AuditAction | null> = {};
//       if (before) {
//         Object.keys(after).forEach((k) => {
//           action[k] = k in before ? null : 'create';
//         });
//         Object.keys(before).forEach((k) => {
//           if (!(k in after)) action[k] = 'delete';
//         });
//       } else {
//         Object.keys(after).forEach((k) => {
//           action[k] = 'create';
//         });
//       }
//       return { data: after, action };
//     }
//   }
// }