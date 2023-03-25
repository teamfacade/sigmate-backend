import { mapValues } from 'lodash';
import { DateTime } from 'luxon';
import WikiBlockError from '../../errors/wiki/block';
import { UserId } from '../../models/User.model';
import { SigmateWikiGSISchema, SigmateWikiSchema } from '../../models/wiki';
import {
  AnyBlockData,
  BlockAttribActions,
  BlockItemExternalData,
  BlockType,
  WikiBlockId,
  WikiBlockSchema,
  WikiBlockVersionId,
  BlockAuditAction,
} from '../../models/wiki/WikiBlock.schema';
import {
  WikiDocumentId,
  WikiDocumentVersionId,
} from '../../models/wiki/WikiDocument.schema';
import Droplet, { DropletId } from '../../utils/droplet';
import { dynamodb, DynamoQueryArgs } from '../dynamodb';
import WikiDiff from './diff';
import WikiValidator from './validate';

export type BlockAction = 'create' | 'update' | 'delete' | 'move';

export interface BlockDTO {
  id: DropletId; // Block ID
  type: BlockType;
  data: AnyBlockData | null;

  keyInfo?: {
    name: string;
    label?: string;
  };
  version: DropletId; // Block version ID
  blockAction: BlockAuditAction | null;
  attribActions: Partial<BlockAttribActions>;
  verificationCount: {
    verify: number;
    beAware: number;
  };
  external?: Record<string, BlockExternalData>;
  /** Derived from Block ID droplet. Discarded when generating items. */
  createdAt: DateTime;
  /** Derived from Block version ID droplet. Discarded when generating items. */
  updatedAt: DateTime;
  document: DropletId; // Document Id
  documentVersion: DropletId; // Document version ID
  isLatestCopy: boolean;
  /** User who created this version */
  updatedById: UserId;
  /** User who first created the block.  */
  createdById?: UserId;
  schema: 1;
}

export type BlockExternalData = {
  cache: BlockItemExternalData['cache'];
  cachedAt: DateTime | null;
  updatedAt?: DateTime;
};

export type GenerateBlockDTO = Omit<
  BlockDTO,
  'isLatestCopy' | 'createdAt' | 'updatedAt'
>;

export type CreateBlockDTO = Omit<
  GenerateBlockDTO,
  'id' | 'version' | 'isLatestCopy' | 'blockAction' | 'attribActions'
>;

/**
 * DTO for block `update` operations (similar to HTTP PATCH)
 * - `undefined` fields will be left unchanged
 * - `null` fields will `delete` that field
 * - New values will overwrite old values (`update`)
 *
 * Difference from `CreateBlockDynamoDTO`:
 * - All fields are optional, except the following, which is **required**
 *   - `document`
 *   - `documentVersion`
 *   - `updatedById`
 * - `external` field is nullable (can be deleted)
 * - `id` field is required
 */
export type UpdateBlockDTO = Partial<
  Omit<
    CreateBlockDTO,
    'external' | 'document' | 'documentVersion' | 'updatedById'
  >
> &
  Pick<CreateBlockDTO, 'document' | 'documentVersion' | 'updatedById'> & {
    id: BlockDTO['id'];
    /** Delete `external` when set to `null` */
    external?: BlockDTO['external'] | null;
  };

// type BlockExtDataStore = {
//   collection?: Collection | null;
//   nft?: Nft | null;
// };

export default class WikiBlock {
  /** DynamoDB table name of the wiki block version data */
  public static TABLE_VERSIONS = 'SigmateWiki';
  /** Use in place of `version` attributes to query for the latest version */
  static VERSION_LATEST = 'latest';
  static VERSION_ALL = 'all';

  static fromVersions(versions: BlockDTO[]) {
    const blockIdMap = new Map<string, WikiBlock>();
    versions.forEach((version) => {
      if (!blockIdMap.has(version.id)) {
        blockIdMap.set(version.id, new WikiBlock({ id: version.id }));
      }
      blockIdMap.get(version.id)?.setVersion(version);
    });
    return Array.from(blockIdMap.values());
  }

  public static async create(dto: CreateBlockDTO) {
    return await this.batchCreate([dto]);
  }

  public static async batchCreate(dtos: CreateBlockDTO[]) {
    // TODO validate create request

    // TODO Fetch external data

    // Generate items
    const items: WikiBlockSchema[] = [];
    dtos.forEach((dto) => {
      const created = WikiDiff.generateCreatedBlock(dto);
      // Create new version
      items.push(WikiBlock.toItem(created));
      // Create latest copy
      items.push(WikiBlock.toItem(created, true));
    });

    await dynamodb.batchWriteItem({
      items: {
        [WikiBlock.TABLE_VERSIONS]: items.map((i) => ({
          PutRequest: { Item: i },
        })),
      },
    });
  }

  public static async batchUpdate(dtos: UpdateBlockDTO[], blocks: WikiBlock[]) {
    const blocksMap = new Map<WikiBlockId, WikiBlock>();
    blocks.forEach((block) => {
      blocksMap.set(block.id, block);
    });

    // TODO validate update request

    // Generate items
    const items: WikiBlockSchema[] = [];
    dtos.forEach((dto) => {
      const block = blocksMap.get(dto.id);
      if (!block) {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/NF_VERSION',
          message: `Version ${dto.id}`,
        });
      }
      const updated = block.generateUpdatedBlock(dto);
      items.push(WikiBlock.toItem(updated));
    });

    await dynamodb.batchWriteItem({
      items: {
        [WikiBlock.TABLE_VERSIONS]: items.map((i) => ({
          PutRequest: { Item: i },
        })),
      },
    });
  }

  public id: WikiBlockId; // Block ID
  public document: WikiDocumentId;
  public versions: Map<WikiBlockVersionId, BlockDTO>;

  private latestVersion?: WikiBlockVersionId;
  public get latest() {
    return this.latestVersion
      ? this.versions.get(this.latestVersion)
      : undefined;
  }

  public generateKey(version: WikiBlockVersionId) {
    return WikiBlock.generateKey({
      id: this.id,
      version,
      document: this.document,
    });
  }

  public generateLatestKey() {
    return WikiBlock.generateLatestKey({
      id: this.id,
      document: this.document,
    });
  }

  public generateAllVersionsQuery() {
    return WikiBlock.generateAllVersionsQuery({
      id: this.id,
      document: this.document,
    });
  }

  constructor(options: WikiBlockOptions) {
    this.versions = new Map();
    if (options.id && options.document) {
      this.id = options.id;
      this.document = options.document;
    } else if (options.dto) {
      const { id, document } = options.dto;
      this.id = id;
      this.document = document;
      this.setVersion(options.dto);
    } else {
      throw new Error('WikiBlock: Invalid constructor options');
    }
  }

  public setVersion(dto: BlockDTO) {
    this.versions.set(dto.version, dto);
    if (dto.isLatestCopy) {
      const latest = this.latest;
      if (latest) {
        if (latest.version !== dto.version) {
          latest.isLatestCopy = false;
          this.latestVersion = dto.version;
        }
      } else {
        this.latestVersion = dto.version;
      }
    }
  }

  public async loadAll() {
    // Fetch all versions
    const { items } = await dynamodb.query(this.generateAllVersionsQuery());
    const blocks: BlockDTO[] = [];
    items.forEach((i) => {
      const item = WikiBlock.validateItem(i);
      const block = WikiBlock.toDTO(item);
      this.setVersion(block);
      blocks.push(block);
    });
    return blocks;
  }

  public async loadOne(options: {
    version: WikiBlockVersionId;
    force?: boolean;
  }) {
    const { force } = options;
    const version: WikiBlockVersionId = options.version;
    if (version === WikiBlock.VERSION_LATEST) {
      // Fetch latest version
      let latest: BlockDTO;
      if (!this.latest || force) {
        const { item } = await dynamodb.getItem({
          tableName: WikiBlock.TABLE_VERSIONS,
          key: this.generateLatestKey(),
        });
        const blockItem = WikiBlock.validateItem(item);
        latest = WikiBlock.toDTO(blockItem);
        this.setVersion(latest);
      } else {
        latest = this.latest;
      }
      return latest;
    } else if (version === WikiBlock.VERSION_ALL) {
      throw new Error('Use the loadAll() method instead');
    } else {
      // Fetch a specific version
      const block = this.versions.get(version);
      if (!block || force) {
        const { item } = await dynamodb.getItem({
          tableName: WikiBlock.TABLE_VERSIONS,
          key: this.generateKey(version),
        });
        const blockItem = WikiBlock.validateItem(item);
        const fetchedBlock = WikiBlock.toDTO(blockItem);
        this.setVersion(fetchedBlock);
        return fetchedBlock;
      } else {
        return block;
      }
    }
  }

  /**
   * Generate data for a new block version.
   * Latest version should be loaded first before calling this function.
   * Function will throw an error when the latest version has not been loaded.
   * @param dto Data for the new version
   * @returns BlockDTO
   */
  public generateUpdatedBlock(dto: UpdateBlockDTO) {
    const latest = this.latest;
    if (!latest) throw new WikiBlockError('WIKI/BLOCK/NF_LATEST');
    const block = WikiDiff.generateUpdatedBlock(dto, latest);
    const { isValid, message } = WikiValidator.validateBlock(block);
    if (!isValid) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_DTO',
        message: Object.keys(message)
          .map((k) => `${k}: ${message[k]}`)
          .join(', '),
      });
    }
    return block;
  }

  /** RegEx for parsing document ID from block partition key */
  private static BlockPKRegEx = /Document#(?<document>\d+)/;
  private static getPK(document: WikiDocumentId) {
    return `Document#${document}`;
  }

  /** RegEx for parsing block ID and block version ID from sort key */
  private static BlockSKRegEx = /Block#(?<id>\d+)#v_(?<version>\d+)/;
  private static getSK(id: WikiBlockId, version: WikiBlockVersionId) {
    return `Block#${id}#v_${version}`;
  }
  private static getAllVersionsSK(id: WikiBlockId) {
    return `Block#${id}#`;
  }

  /** RegEx for parsing block ID and block version ID from sort key of the latest version copy */
  private static BlockSKLatestRegEx = /Block#v_(?<version>\w+)#(?<id>\d+)/;
  private static getLatestSK(id: WikiBlockId) {
    return `Block#v_latest#${id}`;
  }

  private static BlockGSIPKRegEx = /DocVersion#(?<document>\d+)/;
  private static getGSIPK(document: WikiDocumentId) {
    return `DocVersion#${document}`;
  }

  private static BlockGSISKRegEx =
    /Block#dv_(?<documentVersion>\d+)#(?<id>\d+)/;
  private static getGSISK(
    id: WikiBlockId,
    documentVersion: WikiDocumentVersionId
  ) {
    return `Block#dv_${documentVersion}#${id}`;
  }

  private static generateKey(
    dto: Required<Pick<BlockDTO, 'id' | 'version' | 'document'>>
  ): SigmateWikiSchema {
    const { id, version, document } = dto;
    return {
      WikiPK: this.getPK(document),
      WikiSK: this.getSK(id, version),
    };
  }

  private static generateLatestKey(
    dto: Required<Pick<BlockDTO, 'id' | 'document'>>
  ): SigmateWikiSchema {
    const { id, document } = dto;
    return {
      WikiPK: this.getPK(document),
      WikiSK: this.getLatestSK(id),
    };
  }

  private static generateGSIKey(
    dto: Required<Pick<BlockDTO, 'id' | 'document' | 'documentVersion'>>
  ): SigmateWikiGSISchema {
    const { id, document, documentVersion } = dto;
    return {
      WikiGSIPK: this.getGSIPK(document),
      WikiGSISK: this.getGSISK(id, documentVersion),
    };
  }

  private static generateAllVersionsQuery(
    dto: Required<Pick<BlockDTO, 'id' | 'document'>>
  ): DynamoQueryArgs {
    const { id, document } = dto;
    return {
      tableName: WikiBlock.TABLE_VERSIONS,
      keyConditionExpression:
        'WikiPK = :pkval AND begins_with (WikiSK, :skval)',
      expressionAttributeValues: {
        pkVal: this.getPK(document),
        skVal: this.getAllVersionsSK(id),
      },
      ascending: false,
    };
  }

  private static validateItem(
    item: Record<string, unknown> | undefined
  ): WikiBlockSchema {
    if (!item) throw new WikiBlockError('WIKI/BLOCK/IV_ITEM');
    const {
      WikiPK,
      WikiSK,
      WikiGSIPK,
      WikiGSISK,
      Type,
      Data,
      Ext,
      KeyInfo,
      DocVersion,
      BlockVersion,
      BlockAction,
      AttribActions,
      VfCntPosVr,
      VfCntNegBA,
      UpdatedBy,
      CreatedBy,
      Schema,
    } = item;
    if (typeof WikiPK !== 'string') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid WikiPK: ${String(WikiPK)}`,
      });
    }
    if (typeof WikiSK !== 'string') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid WikiSK: ${String(WikiSK)}`,
      });
    }
    if (typeof WikiGSIPK !== 'string' && typeof WikiGSIPK !== 'undefined') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid WikiSK: ${String(WikiSK)}`,
      });
    }

    if (typeof WikiGSISK !== 'string' && typeof WikiGSISK !== 'undefined') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid WikiGSISK: ${String(WikiGSISK)}`,
      });
    }

    if (typeof Type !== 'string' || !WikiValidator.ACTIONS.has(Type)) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid Type: ${String(Type)}`,
      });
    }

    if (!Data || typeof Data !== 'object') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid Data: ${String(Data)}`,
      });
    }

    if (Ext && typeof Ext !== 'object') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid Ext: ${String(Ext)}`,
      });
    }

    if (KeyInfo && typeof KeyInfo !== 'object') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid KeyInfo: ${String(KeyInfo)}`,
      });
    }

    if (typeof DocVersion !== 'string') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid DocVersion: ${String(DocVersion)}`,
      });
    }

    if (typeof BlockVersion !== 'string') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid BlockVersion: ${String(BlockVersion)}`,
      });
    }

    if (typeof BlockAction !== 'string' && BlockAction !== null) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid BlockAction: ${String(BlockAction)}`,
      });
    }

    if (!AttribActions || typeof AttribActions !== 'object') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid AttribActions: ${String(AttribActions)}`,
      });
    }

    if (typeof VfCntPosVr !== 'number' || VfCntPosVr < 0) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid VfCntPosVr: ${String(VfCntPosVr)}`,
      });
    }

    if (typeof VfCntNegBA !== 'number' || VfCntNegBA < 0) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid VfCntNegBA: ${String(VfCntNegBA)}`,
      });
    }

    if (typeof UpdatedBy !== 'string') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid UpdatedBy: ${String(UpdatedBy)}`,
      });
    }

    if (typeof CreatedBy !== 'string') {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid CreatedBy: ${String(CreatedBy)}`,
      });
    }

    if (typeof Schema !== 'number' || Schema !== 1) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Invalid Schema: ${String(Schema)}`,
      });
    }

    return {
      WikiPK,
      WikiSK,
      WikiGSIPK,
      WikiGSISK,
      Type: Type as WikiBlockSchema['Type'],
      Data: Data as WikiBlockSchema['Data'],
      Ext: Ext as WikiBlockSchema['Ext'],
      KeyInfo: KeyInfo as WikiBlockSchema['KeyInfo'],
      DocVersion,
      BlockVersion,
      BlockAction: BlockAction as WikiBlockSchema['BlockAction'],
      AttribActions,
      VfCntPosVr,
      VfCntNegBA,
      UpdatedBy,
      CreatedBy,
      Schema,
    };
  }

  /**
   * Generate a BlockDTO from a DynamoDB item (WikiBlockSchema)
   * @param item DynamoDB item of block
   */
  private static toDTO(item: WikiBlockSchema): BlockDTO {
    const {
      WikiPK,
      WikiSK,
      Type,
      Data,
      Ext,
      KeyInfo,
      DocVersion,
      BlockVersion,
      BlockAction,
      AttribActions,
      VfCntPosVr,
      VfCntNegBA,
      UpdatedBy,
      CreatedBy,
      Schema,
    } = item;

    // Parse document ID from partition key
    const pkMatch = WikiBlock.BlockPKRegEx.exec(WikiPK);
    if (!pkMatch) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_PK',
        message: `PK: ${WikiPK}`,
      });
    }
    const document = pkMatch.groups?.document;
    if (!document) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_PK',
        message: `PK: ${WikiPK}`,
      });
    }

    // Parse block ID and block version from sort key
    const skMatch = WikiBlock.BlockSKRegEx.exec(WikiSK);
    let id: string | undefined = undefined;
    let version: string | undefined = undefined;
    if (skMatch) {
      id = skMatch.groups?.id;
      version = skMatch.groups?.version;
    } else {
      const skLatestMatch = WikiBlock.BlockSKLatestRegEx.exec(WikiSK);
      if (skLatestMatch) {
        id = skLatestMatch.groups?.id;
        version = skLatestMatch.groups?.version;
      } else {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/IV_SK',
          message: `SK: ${WikiSK}`,
        });
      }
    }
    if (!id) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_SK_ID',
        message: `SK: ${WikiSK}`,
      });
    }
    if (!version) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_SK_VERSION',
        message: `SK: ${WikiSK}`,
      });
    }

    return {
      id,
      type: Type,
      data: Data,
      keyInfo: KeyInfo,
      external: mapValues(
        Ext,
        (ext): BlockExternalData => ({
          cache: ext.cache,
          cachedAt: ext.cachedAt ? DateTime.fromISO(ext.cachedAt) : null,
          updatedAt: ext.updatedAt
            ? DateTime.fromISO(ext.updatedAt)
            : undefined,
        })
      ),
      version: BlockVersion,
      isLatestCopy: version === 'latest',
      document,
      documentVersion: DocVersion,
      blockAction: BlockAction,
      attribActions: AttribActions,
      updatedById: UpdatedBy,
      createdById: CreatedBy,
      verificationCount: {
        verify: VfCntPosVr,
        beAware: VfCntNegBA,
      },
      createdAt: Droplet.getDateTime(id),
      updatedAt: Droplet.getDateTime(version),
      schema: Schema,
    };
  }

  /**
   * Generate a DynamoDB item (WikiBlockSchema) from a BlockDTO
   * Only object form converting is performed here, so all other processing should be done elsewhere
   * @param dto GenerateBlockDTO
   * @returns
   */
  private static toItem(
    dto: GenerateBlockDTO,
    isLatestCopy = false
  ): WikiBlockSchema {
    const {
      id,
      type,
      data,
      keyInfo,
      external,
      version,
      document,
      documentVersion,
      blockAction,
      attribActions,
      verificationCount,
      updatedById,
      createdById,
      schema,
    } = dto;

    const shouldCreateGSI =
      !isLatestCopy && (blockAction === 'create' || blockAction === 'update');

    return {
      // Keys
      WikiPK: this.getPK(document),
      WikiSK: isLatestCopy ? this.getLatestSK(id) : this.getSK(id, version),
      WikiGSIPK: shouldCreateGSI ? this.getGSIPK(document) : undefined,
      WikiGSISK: shouldCreateGSI
        ? this.getGSISK(id, documentVersion)
        : undefined,
      // Attributes
      Type: type,
      Data: data,
      Ext: mapValues(
        external,
        (ext): BlockItemExternalData => ({
          cache: ext.cache,
          cachedAt: ext.cachedAt ? ext.cachedAt.toISO() : null,
          updatedAt: ext.updatedAt ? ext.updatedAt.toISO() : undefined,
        })
      ),
      KeyInfo: keyInfo,
      DocVersion: documentVersion,
      BlockVersion: version,
      BlockAction: blockAction,
      AttribActions: attribActions,
      VfCntPosVr: verificationCount.verify,
      VfCntNegBA: verificationCount.beAware,
      UpdatedBy: updatedById,
      CreatedBy: createdById,
      Schema: schema,
    };
  }
}

type WikiBlockOptions = {
  id?: WikiBlockId;
  document?: WikiDocumentId;
  dto?: BlockDTO;
};
