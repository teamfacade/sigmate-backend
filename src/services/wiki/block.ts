import { omit } from 'lodash';
import { BuildArgs, LoadItemArgs, WikiVCS } from '.';
import BlockVersion from '../../dynamoose/models/wiki/BlockVersion';
import { WikiKey } from '../../dynamoose/schemas/wiki';
import WikiBlockError from '../../errors/wiki/block';
import { ActionArgs, ActionMethod } from '../../utils/action';
import Droplet from '../../utils/droplet';
import { WikiDocument } from './document';
import WikiExt from './ext';

type BlockId = sigmate.Wiki.BlockId;
type BlockVersionId = sigmate.Wiki.BlockVersionId;
type BlockItemAttribs = sigmate.Wiki.BlockItemAttribs;
type BlockRawItemAttribs = sigmate.Wiki.BlockRawItemAttribs;
type BlockBuildAttribs = sigmate.Wiki.BlockBuildAttribs;

type DocumentId = sigmate.Wiki.DocumentId;
type DocumentVersionId = sigmate.Wiki.DocumentVersionId;

export class WikiBlock extends WikiVCS<
  BlockRawItemAttribs,
  BlockItemAttribs,
  BlockBuildAttribs,
  BlockId,
  BlockVersionId
> {
  public static SUPPORTED_TYPES = [
    'header',
    'paragraph',
    'list',
    'table',
    'image',
    'warning',
  ];

  public static PK_REGEX = WikiDocument.PK_REGEX;
  public static SK_REGEX = /Block::v_(?<documentVersion>)\d+::(?<id>\d+)/;
  public static GSI_PK_REGEX = /DocVersion::(?<id>\d+)/;
  public static GSI_SK_REGEX = /Block::(?<id>\d+)::v_(?<version>\d+)/;

  private documentId: DocumentId;
  private versionMap: Map<DocumentVersionId, BlockVersionId>;

  constructor(id: BlockId, documentId: DocumentId) {
    super(id);
    this.documentId = documentId;
    this.versionMap = new Map();
    this.setEventHandler('setItem', (item) => {
      this.versionMap.set(item.documentVersion, item.version);
    });
  }

  /**
   * Load all blocks of a certain version of a document
   * @param args Document ID and version ID
   */
  @ActionMethod({
    name: 'WIKI/BLOCK/LOAD_DOC',
    type: 'AWS',
  })
  public static async loadDocumentBlocks(
    args: {
      document: { id: DocumentId; version: DocumentVersionId };
    } & ActionArgs
  ) {
    const { document } = args;
    if (document.version === WikiDocument.VERSION_LATEST) {
      const query = BlockVersion.query(WikiKey.PK_NAME)
        .eq(WikiKey.getDocumentPK(document.id))
        .and()
        .where(WikiKey.SK_NAME)
        .beginsWith(WikiKey.getBlockSK('', WikiDocument.VERSION_LATEST))
        .sort('descending')
        .all(50);

      const rawItems = await query.exec();
      const blocks = rawItems.map((rawItem) => {
        const item = WikiBlock.toItem(rawItem);
        const block = new WikiBlock(item.id, item.document);
        block.setItem(item);
        return block;
      });

      return blocks;
    } else {
      throw new Error('Not implemented: Loading past document versions');
    }
  }

  @ActionMethod({
    name: 'WIKI/BLOCK/BUILD',
    type: 'COMPLEX',
  })
  public async build(
    args: BuildArgs<BlockVersionId> & ActionArgs
  ): Promise<BlockBuildAttribs> {
    const { options } = args;
    const version = this.getVersionId(args.version); // Block version ID
    const { force, blockStructure, select } = options;

    let build = this.buildMap.get(version);
    if (!build || force) {
      if (!blockStructure) {
        throw new WikiBlockError('WIKI/BLOCK/ER_BUILD_NF_STRUCT');
      }
      const { id, documentVersion, action } = blockStructure;
      if (this.id !== id) {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/ER_BUILD_ID',
          message: `Expected: ${this.id}, Got: ${id}`,
        });
      }
      if (this.versionMap.get(documentVersion) !== version) {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/ER_BUILD_VERSION',
          message: `Expected: ${version}, Got: ${this.versionMap.get(
            documentVersion
          )} From: ${documentVersion}`,
        });
      }

      // Try loading item
      const item = await this.loadItem({ version, force, select });
      if (version !== item.version) {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/ER_BUILD_VERSION',
          message: `Expected: ${version}, Got: ${item.version}`,
        });
      }
      if (documentVersion !== item.documentVersion) {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/ER_BUILD_DOC_VERSION',
          message: `Expected: ${documentVersion}, Got: ${item.documentVersion}`,
        });
      }

      build = {
        ...omit(item, ['isLatestCache', 'isGSI']),
        structureAction: action,
      };
    }
    return build;
  }

  @ActionMethod({
    name: 'WIKI/BLOCK/LOAD_ITEM',
    type: 'AWS',
  })
  protected async loadItem(
    args: LoadItemArgs<BlockVersionId> & ActionArgs
  ): Promise<BlockItemAttribs> {
    const { force, select } = args;
    const version = this.getVersionId(args.version);
    let item = this.getItem(version);
    if (!item || force) {
      const rawItem = await BlockVersion.get(
        {
          WikiPK: WikiKey.getBlockGSIPK(this.documentId),
          WikiSK: WikiKey.getBlockGSISK(this.id, version),
        },
        { consistent: false }
      );
      item = this.toItem(rawItem);
      this.setItem(item, {
        select,
        isLatest: version === WikiBlock.VERSION_LATEST,
      });
    }
    return item;
  }

  protected static toRawItem(item: BlockItemAttribs): BlockRawItemAttribs {
    const {
      id,
      type,
      data,
      verificationCount,
      keyInfo,
      external,
      auditedById,
      version: versionId,
      document,
      documentVersion: documentVersionId,
      isLatestCache,
      isGSI,
      blockAction,
      attribActions,
      schema,
    } = item;

    const version = isLatestCache ? WikiBlock.VERSION_LATEST : versionId;
    const documentVersion = isLatestCache
      ? WikiDocument.VERSION_LATEST
      : documentVersionId;

    return {
      WikiPK: WikiKey.getDocumentPK(document),
      WikiSK: WikiKey.getBlockSK(id, documentVersion),
      WikiGSIPK:
        isLatestCache || isGSI ? WikiKey.getBlockGSIPK(document) : undefined,
      WikiGSISK:
        isLatestCache || isGSI ? WikiKey.getBlockGSISK(id, version) : undefined,
      BlockVersion: versionId,
      DocumentVersion: documentVersionId,
      Type: type,
      Data: data,
      VfCntPosVr: verificationCount.verify,
      VfCntNegBA: verificationCount.beAware,
      KeyInfo: keyInfo,
      Ext: WikiExt.toRawItem(external),
      AuditedBy: auditedById,
      BlockAction: blockAction,
      AttribActions: attribActions,
      Schema: schema,
    };
  }

  protected toRawItem(item: BlockItemAttribs): BlockRawItemAttribs {
    return WikiBlock.toRawItem(item);
  }

  protected static toItem(rawItem: BlockRawItemAttribs): BlockItemAttribs {
    const {
      WikiPK,
      WikiSK,
      WikiGSISK,
      BlockVersion,
      DocumentVersion,
      Type,
      Data,
      Ext,
      KeyInfo,
      BlockAction,
      AttribActions,
      VfCntPosVr,
      VfCntNegBA,
      AuditedBy,
      Schema,
    } = rawItem;

    // Parse document ID from partition key
    const pkMatch = WikiBlock.PK_REGEX.exec(WikiPK);
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

    // Parse block ID from sort key
    let id: string | undefined = undefined;
    let skVersion: string | undefined = undefined;
    let isGSI = false;
    if (WikiGSISK) {
      const gsiSKMatch = WikiBlock.GSI_SK_REGEX.exec(WikiGSISK);
      if (gsiSKMatch?.groups) {
        id = gsiSKMatch.groups.id;
        skVersion = gsiSKMatch.groups.version;
        isGSI = true;
      }
    } else if (WikiSK) {
      const skMatch = WikiBlock.SK_REGEX.exec(WikiSK);
      if (skMatch?.groups) {
        id = skMatch.groups.id;
        skVersion = skMatch.groups.documentVersion;
      }
    }

    if (!id) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_SK_ID',
        message: `WikiSK: ${WikiSK}`,
      });
    }

    if (!skVersion) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_SK_VERSION',
        message: `WikiSK: ${WikiSK}, WikiGSISK: ${WikiGSISK}`,
      });
    }

    return {
      id,
      type: Type,
      data: Data,
      verificationCount: {
        verify: VfCntPosVr,
        beAware: VfCntNegBA,
      },
      keyInfo: KeyInfo,
      external: WikiExt.toItem(Ext),
      auditedById: AuditedBy,

      version: BlockVersion,
      document,
      documentVersion: DocumentVersion,
      isLatestCache: skVersion === WikiBlock.VERSION_LATEST,
      isGSI,
      blockAction: BlockAction,
      attribActions: AttribActions,

      createdAt: Droplet.getDateTime(id),
      auditedAt: Droplet.getDateTime(BlockVersion),
      schema: Schema,
    };
  }

  protected toItem(rawItem: BlockRawItemAttribs): BlockItemAttribs {
    return WikiBlock.toItem(rawItem);
  }
}
