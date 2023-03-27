import { forEach } from 'lodash';
import { DateTime } from 'luxon';
import Droplet from '../../utils/droplet';
import { BlockDTO } from './block';

type ValidationResult = {
  isValid: boolean;
  message?: string;
};

export type ValidationResults = {
  isValid: boolean;
  message: Record<string, string>;
};

// type CollectionKIName =
//   | 'KIClTeam'
//   | 'KIClHistory'
//   | 'KIClDiscord'
//   | 'KIClTwitter'
//   | 'KIClCategory'
//   | 'KIClMintingPrices'
//   | 'KIClFloorprice'
//   | 'KIClMarketplaces';

export default class WikiValidator {
  /** Possible values for `block.type` */
  private static BLOCK_TYPES = new Set<string>([
    'header',
    'image',
    'list',
    'paragraph',
    'table',
    'warning',
  ]);

  private static BLOCK_KI_NAMES = new Set<string>([
    'KIClTeam',
    'KIClHistory',
    'KIClDiscord',
    'KIClTwitter',
    'KIClCategory',
    'KIClMintingPrices',
    'KIClFloorprice',
    'KIClMarketplaces',
  ]);

  /** Possible values for `BlockAuditAction` typed attributes */
  static ACTIONS = new Set<string>(['create', 'update', 'delete']);
  static STRUCT_ACTIONS = new Set<string>([
    'create',
    'update',
    'delete',
    'move',
  ]);

  public static validateBlockStructureHistory(object: unknown, throws = false) {
    try {
      if (!object || typeof object !== 'object') {
        throw new Error('Invalid type');
      }
      const { id, version, action, children } = object as Record<
        string,
        unknown
      >;
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid block ID');
      }
      if (!Droplet.isValid(id)) {
        throw new Error('Invalid Droplet (block ID)');
      }
      if (!version || typeof version !== 'string') {
        throw new Error('Invalid block version ID');
      }
      if (!Droplet.isValid(version)) {
        throw new Error('Invalid Droplet (block version ID)');
      }
      if (action !== null) {
        if (typeof action !== 'string' || !this.STRUCT_ACTIONS.has(action)) {
          throw new Error('Invalid action');
        }
      }
      if (children) {
        if (children instanceof Array) {
          children.forEach((child) => {
            this.validateBlockStructureHistory(child, true);
          });
        } else {
          throw new Error('Invalid children: Not an array');
        }
      }
      return true;
    } catch (error) {
      if (throws) throw error;
      return false;
    }
  }

  public static validateBlock(dto: Partial<BlockDTO>): ValidationResults {
    const results: ValidationResults = {
      isValid: true,
      message: {},
    };
    if (dto.id !== undefined) {
      const { isValid, message } = this.validateBlockId(dto.id);
      if (!isValid && message) {
        results.isValid = false;
        results.message.id = message;
      }
    }
    if (dto.type !== undefined) {
      const { isValid, message } = this.validateBlockType(dto.type);
      if (!isValid && message) {
        results.isValid = false;
        results.message.type = message;
      }
    }
    if (dto.data !== undefined) {
      if (dto.type !== undefined) {
        const { isValid, message } = this.validateBlockData(dto.data, dto.type);
        if (!isValid && message) {
          results.isValid = false;
          results.message.data = message;
        }
      } else {
        results.isValid = false;
        results.message.type = 'Missing type';
      }
    }
    if (dto.version !== undefined) {
      const { isValid, message } = this.validateBlockVersion(dto.version);
      if (!isValid && message) {
        results.isValid = false;
        results.message.version = message;
      }
    }
    if (dto.blockAction !== undefined) {
      const { isValid, message } = this.validateBlockAction(dto.blockAction);
      if (!isValid && message) {
        results.isValid = false;
        results.message.blockAction = message;
      }
    }
    if (dto.attribActions !== undefined) {
      const { isValid, message } = this.validateBlockAttribActions(
        dto.attribActions
      );
      if (!isValid && message) {
        results.isValid = false;
        results.message.attribActions = message;
      }
    }
    if (dto.verificationCount !== undefined) {
      const { isValid, message } = this.validateBlockVerificationCount(
        dto.verificationCount
      );
      if (!isValid && message) {
        results.isValid = false;
        results.message.verificationCount = message;
      }
    }
    if (dto.external !== undefined) {
      const { isValid, message } = this.validateBlockExternal(dto.external);
      if (!isValid && message) {
        results.isValid = false;
        results.message.external = message;
      }
    }
    if (dto.document !== undefined) {
      const { isValid, message } = this.validateDocumentId(dto.document);
      if (!isValid && message) {
        results.isValid = false;
        results.message.document = message;
      }
    }
    if (dto.documentVersion !== undefined) {
      const { isValid, message } = this.validateDocumentVersionId(
        dto.documentVersion
      );
      if (!isValid && message) {
        results.isValid = false;
        results.message.documentVersion = message;
      }
    }
    if (dto.updatedById !== undefined) {
      const { isValid, message } = this.validateUserId(dto.updatedById);
      if (!isValid && message) {
        results.isValid = false;
        results.message.updatedById = message;
      }
    }
    if (dto.createdById !== undefined) {
      const { isValid, message } = this.validateUserId(dto.createdById);
      if (!isValid && message) {
        results.isValid = false;
        results.message.createdById = message;
      }
    }
    return results;
  }

  private static validateBlockId(id: BlockDTO['id']): ValidationResult {
    const isValid = Droplet.isValid(id);
    const message = isValid ? undefined : 'Invalid Droplet';
    return { isValid, message };
  }

  private static validateBlockType(type: BlockDTO['type']): ValidationResult {
    const isValid = this.BLOCK_TYPES.has(type);
    const message = isValid ? undefined : 'Unsupported type';
    return { isValid, message };
  }

  private static validateBlockData(
    data: BlockDTO['data'],
    type: BlockDTO['type']
  ): ValidationResult {
    if (!data) return { isValid: true };
    let isValid = true;
    let message: string | undefined = undefined;
    const d: Record<string, unknown> = data;
    switch (type) {
      case 'header':
        if (typeof d.text !== 'string' || typeof d.level !== 'number') {
          isValid = false;
          message = 'Invalid data for "header" block';
        }
        break;
      case 'paragraph':
        if (typeof d.text !== 'string') {
          isValid = false;
          message = 'Invalid data for "paragraph" block';
        }
        break;
      case 'list':
        if (typeof d.style !== 'string') {
          isValid = false;
          message = 'Invalid data for "list" block (style)';
        }
        if (d.items instanceof Array) {
          // Items: All items must be strings
          for (let i = 0; i < d.items.length; i++) {
            if (typeof d.items[i] !== 'string') {
              isValid = false;
              message = 'Invalid data for "list" block (item)';
              break;
            }
          }

          // Nested Items
          if (!isValid) {
            isValid = this.validateNestedListItems(d.items);
            message = isValid ? undefined : message;
          }
        } else {
          isValid = false;
          message = 'Invalid data for "list" block (items not an array)';
        }
        break;
      case 'table':
        if (typeof d.withHeadings !== 'boolean') {
          isValid = false;
          message = 'Invalid data for "table" block (withHeadings)';
        }

        if (d.content instanceof Array) {
          d.content.forEach((row) => {
            if (row instanceof Array) {
              for (const col of row) {
                if (typeof col !== 'string') {
                  isValid = false;
                  message = 'Invalid data for "table" block (col)';
                  break;
                }
              }
            } else {
              isValid = false;
              message = 'Invalid data for "table" block (row)';
            }
          });
        } else {
          isValid = false;
          message = 'Invalid data for "table" block (content)';
        }
        break;
      case 'image':
        if (!d.file) {
          isValid = false;
          message = 'Invalid data for "image" block (file)';
          break;
        } else if (typeof d.file === 'object') {
          const file: any = d.file;
          if (!file.url) {
            isValid = false;
            message = 'Invalid data for "image" block (url)';
            break;
          }
        }
        if (d.caption && typeof d.caption !== 'string') {
          isValid = false;
          message = 'Invalid data for "image" block (caption)';
          break;
        }

        if (d.withBorder !== undefined && typeof d.withBorder !== 'boolean') {
          isValid = false;
          message = 'Invalid data for "image" block (withBorder)';
          break;
        }

        if (
          d.withBackground !== undefined &&
          typeof d.withBackground !== 'boolean'
        ) {
          isValid = false;
          message = 'Invalid data for "image" block (withBackground)';
          break;
        }

        if (d.stretched !== undefined && typeof d.stretched !== 'boolean') {
          isValid = false;
          message = 'Invalid data for "image" block (stretched)';
          break;
        }
        break;
      case 'warning':
        if (typeof d.title !== 'string') {
          isValid = false;
          message = 'Invalid data for "warning" block (title)';
          break;
        }
        if (typeof d.message !== 'string') {
          isValid = false;
          message = 'Invalid data for "warning" block (message)';
          break;
        }
        break;
    }

    return { isValid, message };
  }

  private static validateBlockKI(
    keyInfo: BlockDTO['keyInfo']
  ): ValidationResult {
    if (keyInfo === undefined) return { isValid: true };
    if (!keyInfo.name || typeof keyInfo.name !== 'string') {
      return {
        isValid: false,
        message: 'Invalid keyInfo (name)',
      };
    }
    if (!this.BLOCK_KI_NAMES.has(keyInfo.name)) {
      return {
        isValid: false,
        message: 'Invalid keyInfo (unexpected name)',
      };
    }

    if (keyInfo.label !== undefined && typeof keyInfo.label !== 'string') {
      return {
        isValid: false,
        message: 'Invalid keyInfo (label)',
      };
    }

    return { isValid: true };
  }

  private static validateBlockVersion(
    version: BlockDTO['version']
  ): ValidationResult {
    const isValid = Droplet.isValid(version);
    return { isValid, message: isValid ? undefined : 'Invalid Droplet' };
  }

  private static validateBlockAction(blockAction: BlockDTO['blockAction']) {
    const isValid = blockAction === null || this.ACTIONS.has(blockAction);
    return { isValid, message: isValid ? undefined : 'Invalid block action' };
  }

  private static validateBlockAttribActions(
    attribActions: BlockDTO['attribActions']
  ): ValidationResult {
    if (!attribActions) {
      return { isValid: false, message: 'attribActions not found' };
    }
    if (attribActions.Type && !this.ACTIONS.has(attribActions.Type)) {
      return {
        isValid: false,
        message: 'Invalid attribActions (Type)',
      };
    }
    if (attribActions.Data && !this.ACTIONS.has(attribActions.Data)) {
      return {
        isValid: false,
        message: 'Invalid attribActions (Data)',
      };
    }

    if (attribActions.Ext) {
      try {
        forEach(attribActions.Ext, (v) => {
          if (v !== null && !this.ACTIONS.has(v)) {
            throw new Error();
          }
        });
      } catch (error) {
        return {
          isValid: false,
          message: 'Invalid attribActions (Ext)',
        };
      }
    }

    if (attribActions.KeyInfo) {
      const label = attribActions.KeyInfo?.label;
      if (label !== null && label !== undefined && !this.ACTIONS.has(label)) {
        return {
          isValid: false,
          message: 'Invalid attribActions (KeyInfo)',
        };
      }
    }

    return { isValid: true };
  }

  private static validateBlockVerificationCount(
    verificationCount: BlockDTO['verificationCount']
  ): ValidationResult {
    const { verify, beAware } = verificationCount;
    if (typeof verify !== 'number' || verify < 0) {
      return {
        isValid: false,
        message: 'Invalid verificationCount.verify',
      };
    }

    if (typeof beAware !== 'number' || beAware < 0) {
      return {
        isValid: false,
        message: 'Invalid verificationCount.beAware',
      };
    }

    return { isValid: true };
  }

  private static validateBlockExternal(
    external: BlockDTO['external']
  ): ValidationResult {
    try {
      forEach(external, (ext, key) => {
        if (
          ext.cachedAt &&
          (!(ext.cachedAt instanceof DateTime) || !ext.cachedAt.isValid)
        ) {
          throw new Error(`cachedAt not a valid DateTime (${key})`);
        }
        if (
          ext.updatedAt &&
          (!(ext.updatedAt instanceof DateTime) || !ext.updatedAt.isValid)
        ) {
          throw new Error(`updatedAt not a valid DateTime (${key})`);
        }
      });
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'Invalid external',
      };
    }
  }

  private static validateDocumentId(id: string): ValidationResult {
    const isValid = Droplet.isValid(id);
    return { isValid, message: isValid ? undefined : 'Invalid Droplet' };
  }

  private static validateDocumentVersionId(version: string): ValidationResult {
    const isValid = Droplet.isValid(version);
    return { isValid, message: isValid ? undefined : 'Invalid Droplet' };
  }

  private static validateUserId(userId: string): ValidationResult {
    const isValid = Droplet.isValid(userId);
    return { isValid, message: isValid ? undefined : 'Invalid Droplet' };
  }

  private static validateNestedListItems(data: any) {
    try {
      if (data instanceof Array) {
        data.forEach((item) => {
          if (typeof item?.content !== 'string') {
            throw new Error();
          }
          if (item?.items instanceof Array) {
            item.items.forEach((item: any) =>
              this.validateNestedListItems(item)
            );
          } else {
            throw new Error();
          }
        });
      } else {
        throw new Error();
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}
