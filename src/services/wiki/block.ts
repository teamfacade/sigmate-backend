import { fromPairs } from 'lodash';
import { DateTime } from 'luxon';
import { CommandInput, WikiVCS } from '.';
import BlockVersion, {
  BlockVersionItem,
} from '../../dynamoose/models/wiki/BlockVersion';
import { WikiKey } from '../../dynamoose/schemas/wiki';
import WikiBlockError from '../../errors/wiki/block';
import { User } from '../../models/User.model';
import { ActionArgs, ActionMethod } from '../../utils/action';
import Droplet from '../../utils/droplet';
import WikiDiff from './diff';
import { WikiDocument } from './document';
import WikiExt from './ext';
import RequestError from '../../errors/request';

export class WikiBlock extends WikiVCS<
  sigmate.Wiki.BlockRawAttribs,
  sigmate.Wiki.BlockAttribs,
  sigmate.Wiki.BlockResponse,
  sigmate.Wiki.BlockCRequest,
  sigmate.Wiki.BlockURequest
> {
  public static SUPPORTED_TYPES = [
    'header',
    'paragraph',
    'list',
    'table',
    'image',
    'warning',
  ];

  /** Possible values for Block Key info name */
  public static KI_NAMES: Set<string> = new Set([
    'KIClTeam',
    'KIClHistory',
    'KIClDiscord',
    'KIClTwitter',
    'KIClCategory',
    'KIClMintingPrices',
    'KIClFloorprice',
    'KIClMarketplaces',
  ]);

  public static PK_REGEX = WikiDocument.PK_REGEX;
  public static SK_REGEX = /Block::v_(?<documentVersion>)\d+::(?<id>\d+)/;
  public static GSI_PK_REGEX = /DocVersion::(?<id>\d+)/;
  public static GSI_SK_REGEX = /Block::(?<id>\d+)::v_(?<version>\d+)/;
  private static ID_ALL = '';

  public static async loadDocument(document: WikiDocument) {
    if (document.selected.isLatest) {
      const query = BlockVersion.query(WikiKey.PK_NAME)
        .eq(WikiKey.getDocumentPK(document.id))
        .and()
        .filter(WikiKey.SK_NAME)
        .beginsWith(
          WikiKey.getBlockSK(WikiBlock.ID_ALL, WikiDocument.VERSION_LATEST)
        );
      const rawBlocks = await query.exec();
      const blocks = rawBlocks.map((rawBlock) => WikiBlock.__load(rawBlock));
      return blocks.map((block) => WikiBlock.fromAttribs(document, block));
    } else {
      throw new Error('Not implemented: Load document blocks');
    }
  }

  public static fromAttribs(
    document: WikiDocument,
    attribs: sigmate.Wiki.BlockAttribs
  ) {
    const block = new WikiBlock(document, attribs.id);
    block.setVersion(attribs, { select: true });
    return block;
  }

  private document: WikiDocument;

  constructor(document: WikiDocument, id?: sigmate.Wiki.BlockId) {
    super(id);
    this.document = document;
    this.versionMap = new Map();
  }

  @ActionMethod({
    name: 'WIKI/BLOCK/LOAD',
    type: 'AWS',
  })
  public async load(
    args: {
      version?: string | typeof WikiBlock['VERSION_LATEST'];
      documentVersion?: string;
      select?: boolean;
      force?: boolean;
      consistent?: boolean;
    } & ActionArgs
  ): Promise<sigmate.Wiki.BlockAttribs> {
    const {
      version,
      documentVersion,
      select = true,
      force = false,
      consistent = false,
    } = args;
    let block = this.getVersion(version);
    if (!block || force) {
      let WikiPK: string | undefined = undefined;
      let WikiSK: string | undefined = undefined;
      let WikiGSIPK: string | undefined = undefined;
      let WikiGSISK: string | undefined = undefined;

      if (version === WikiBlock.VERSION_LATEST) {
        // Get cache(latest): No index
        WikiPK = WikiKey.getDocumentPK(this.document.id);
        WikiSK = WikiKey.getBlockSK(this.id, WikiDocument.VERSION_LATEST);
      } else if (version) {
        // Search by block version: Use GSI
        WikiGSIPK = WikiKey.getBlockGSIPK(this.document.id);
        WikiGSISK = WikiKey.getBlockGSISK(this.id, version);
      } else if (documentVersion) {
        // Search by document version: No index
        WikiPK = WikiKey.getDocumentPK(this.document.id);
        WikiSK = WikiKey.getBlockSK(this.id, documentVersion);
      } else {
        throw new Error('load() invalid args');
      }

      let raw: BlockVersionItem;
      if (WikiPK && WikiSK) {
        raw = await BlockVersion.get({ WikiPK, WikiSK }, { consistent });
      } else if (WikiGSIPK && WikiGSISK) {
        raw = await BlockVersion.get(
          { WikiGSIPK, WikiGSISK },
          { consistent: false }
        );
      } else {
        throw new Error('load() invalid keys');
      }
      block = this.__load(raw);
      this.setVersion(block, { select });
    }
    return block;
  }

  @ActionMethod({
    name: 'WIKI/BLOCK/BUILD',
    type: 'COMPLEX',
    transaction: false,
  })
  public async build(
    args: {
      version?: string | typeof WikiBlock['VERSION_LATEST'];
      select?: boolean;
      force?: boolean;
      transposed?: sigmate.Wiki.DiffTranspose;
      loadAuditor?: boolean;
    } & ActionArgs
  ): Promise<sigmate.Wiki.BlockResponse> {
    const {
      version,
      select = true,
      force = false,
      transposed,
      loadAuditor,
      action,
    } = args;
    const block = await this.load({
      version,
      select,
      force,
      parentAction: action,
    });
    const document = this.document.selected;
    // Build external data
    if (block.external && document.external) {
      const de = document.external;
      block.external.forEach((name) => {
        if (WikiExt.isBuildable(name)) {
          this.buildExt(block.data, WikiExt.ExtRE[name], de[name]);
        }
      });
    }

    // Load auditedBy
    if (loadAuditor) {
      block.auditedBy = await User.findByPk(block.auditedById, {
        rejectOnEmpty: true,
      });
    }
    block.transposed = transposed;
    block.buildAt = DateTime.now();
    return {
      ...block,
      auditedBy: block.auditedBy?.toResponse(),
      createdAt: Droplet.getISO(block.id),
      auditedAt: Droplet.getISO(block.version),
    };
  }

  @ActionMethod({
    name: 'WIKI/BLOCK/CREATE',
    type: 'AWS',
  })
  public async create(
    args: {
      execute?: boolean;
      request: sigmate.Wiki.BlockCRequest;
      rest: { document: { version: sigmate.Wiki.DocumentVersionId } };
    } & ActionArgs
  ): Promise<CommandInput<sigmate.Wiki.BlockRawAttribs>> {
    const { execute, request, rest, req, action } = args;
    const auditedBy = req?.user;
    if (!auditedBy) {
      throw new RequestError('REQ/RJ_UNAUTHENTICATED');
    }

    const created = this.__create(request, {
      document: { id: request.document.id, version: rest.document.version },
      auditedBy,
    });

    this.setVersion(created);

    const blockRawOriginal = this.__save(created);
    const blockRawCache = this.__save(created, WikiBlock.CACHE_LATEST);

    const input: CommandInput<sigmate.Wiki.BlockRawAttribs> = {
      put: [blockRawOriginal, blockRawCache],
    };

    if (execute) {
      await this.save({ input, parentAction: action });
    }

    return input;
  }

  @ActionMethod({
    name: 'WIKI/BLOCK/UPDATE',
    type: 'AWS',
  })
  public async update(
    args: {
      execute?: boolean;
      request: sigmate.Wiki.BlockURequest;
      rest: { document: { version: sigmate.Wiki.DocumentVersionId } };
    } & ActionArgs
  ): Promise<CommandInput<sigmate.Wiki.BlockRawAttribs>> {
    const { execute, request, rest, req, action } = args;
    const auditedBy = req?.user;
    if (!auditedBy) {
      throw new RequestError('REQ/RJ_UNAUTHENTICATED');
    }
    const latest = await this.load({
      version: WikiBlock.VERSION_LATEST,
      force: true,
      consistent: true,
    });
    const document = {
      id: request.document.id,
      version: rest.document.version,
    };

    const updated = this.__update(request, {
      document,
      auditedBy,
      latest,
    });

    this.setVersion(updated);

    const latestOriginal = this.__save(latest);
    const updatedOriginal = this.__save(updated);
    const updatedCache = this.__save(updated, WikiBlock.CACHE_LATEST);

    const input: CommandInput<sigmate.Wiki.BlockRawAttribs> = {
      put: [updatedOriginal, updatedCache],
      update: {
        key: {
          WikiGSIPK: latestOriginal.WikiGSIPK as NonNullable<
            sigmate.Wiki.WikiAttribs['WikiGSIPK']
          >,
          WikiGSISK: latestOriginal.WikiGSISK as NonNullable<
            sigmate.Wiki.WikiAttribs['WikiGSISK']
          >,
        },
        attribs: {
          VfCntPosVr: latest.verificationCount.verify,
          VfCntNegBA: latest.verificationCount.beAware,
        },
      },
    };

    if (execute) {
      await this.save({ input, parentAction: action });
    }

    return input;
  }

  @ActionMethod({
    name: 'WIKI/BLOCK/DELETE',
    type: 'AWS',
  })
  public async delete(
    args: { execute?: boolean } & ActionArgs
  ): Promise<CommandInput<sigmate.Wiki.BlockRawAttribs>> {
    const { execute, req, action } = args;
    const auditedBy = req?.user;
    if (!auditedBy) {
      throw new RequestError('REQ/RJ_UNAUTHENTICATED');
    }

    const latest = await this.load({
      version: WikiBlock.VERSION_LATEST,
      force: true,
      consistent: true,
    });

    const latestOriginal = this.__save(latest);
    const deleted = this.__delete(latest, { auditedBy });
    const deletedRaw = this.__save(deleted, WikiBlock.CACHE_LATEST);

    this.setVersion(deleted);

    const input: CommandInput<sigmate.Wiki.BlockRawAttribs> = {
      put: [deletedRaw],
      update: {
        key: {
          WikiGSIPK: latestOriginal.WikiGSIPK as NonNullable<
            sigmate.Wiki.WikiAttribs['WikiGSIPK']
          >,
          WikiGSISK: latestOriginal.WikiGSISK as NonNullable<
            sigmate.Wiki.WikiAttribs['WikiGSISK']
          >,
        },
        attribs: {
          VfCntPosVr: latest.verificationCount.verify,
          VfCntNegBA: latest.verificationCount.beAware,
        },
      },
    };

    if (execute) {
      await this.save({ input, parentAction: action });
    }

    return input;
  }

  /**
   * Replace External data placeholders with actual data.
   * Only external data in string form are supported.
   * If data is not in string form, not cached, or null, placeholders will be replaced with an empty string.
   */
  private buildExt(
    data: Record<string, unknown> | null,
    regex: RegExp,
    ext: sigmate.Wiki.Ext | null | undefined
  ) {
    if (!data) return;
    const replaceValue = typeof ext?.cache === 'string' ? ext.cache : '';
    // Header, Paragraph
    if (typeof data.text === 'string') {
      data.text = data.text.replace(regex, replaceValue);
    } else if (typeof data.style === 'string' && data.items instanceof Array) {
      const items = data.items;
      items.forEach((item, idx) => {
        if (typeof item === 'string') {
          // List
          items[idx] = item.replace(regex, replaceValue);
        } else if (
          typeof item.content === 'string' &&
          item.items instanceof Array
        ) {
          // Nested List
          this.buildExt(item, regex, ext);
        }
      });
    } else if (
      typeof data.content === 'string' &&
      data.items instanceof Array
    ) {
      // Nested List Item
      data.content = data.content.replace(regex, replaceValue);
      data.items.forEach((item) => {
        this.buildExt(item, regex, ext);
      });
    } else if (
      typeof data.withHeadings === 'boolean' &&
      data.content instanceof Array
    ) {
      // Table
      data.content.forEach((row) => {
        if (row instanceof Array) {
          row.forEach((col, idx) => {
            if (typeof col === 'string') {
              row[idx] = col.replace(regex, replaceValue);
            }
          });
        }
      });
    }
  }

  protected __create(
    request: sigmate.Wiki.BlockCRequest,
    rest: Required<Pick<sigmate.Wiki.BlockAttribs, 'document' | 'auditedBy'>>
  ): sigmate.Wiki.BlockAttribs {
    const { type, data, keyInfo, external, schema } = request;
    const { document, auditedBy } = rest;

    const id = this.id;
    const version = Droplet.generate();

    return {
      id,
      type,
      data,
      verificationCount: {
        verify: 0,
        beAware: 0,
      },
      keyInfo,
      external: new Set(external as sigmate.Wiki.ExtDataName[]),
      version,
      isLatest: true,
      action: WikiDiff.CREATED,
      diff: {
        type: WikiDiff.CREATED,
        data: WikiDiff.CREATED,
        keyInfo: keyInfo ? WikiDiff.CREATED : undefined,
        external: external
          ? fromPairs(
              Array.from(external).map((name) => [name, WikiDiff.CREATED])
            )
          : undefined,
      },
      auditedById: auditedBy.id,
      auditedBy,
      document,
      schema,
    };
  }

  protected __update(
    request: sigmate.Wiki.BlockURequest,
    rest: Required<
      Pick<sigmate.Wiki.BlockAttribs, 'document' | 'auditedBy'>
    > & { latest: sigmate.Wiki.BlockAttribs }
  ): sigmate.Wiki.BlockAttribs {
    const { id, schema } = request;
    const { document, auditedBy, latest } = rest;

    const [type, typeDiff] = WikiDiff.compareBlockType(
      request.type,
      latest.type
    );
    const [data, dataDiff] = WikiDiff.compareBlockData(
      request.data,
      latest.data
    );
    const [keyInfo, kiDiff] = WikiDiff.compareBlockKI(
      request.keyInfo,
      latest.keyInfo
    );
    const [external, extDiff] = WikiDiff.compareBlockExt(
      request.external,
      latest.external
    );
    const version = Droplet.generate();
    const action: sigmate.Wiki.DiffAction = WikiDiff.isBlockUpdated(
      typeDiff,
      dataDiff,
      kiDiff,
      extDiff
    )
      ? WikiDiff.UPDATED
      : WikiDiff.NO_CHANGE;

    return {
      id,
      type,
      data,
      verificationCount: {
        verify: 0,
        beAware: 0,
      },
      keyInfo,
      external,
      version,
      isLatest: true,
      action,
      diff: {
        type: typeDiff,
        data: dataDiff,
        keyInfo: kiDiff,
        external: extDiff,
      },
      auditedById: auditedBy.id,
      auditedBy,
      document,
      schema,
    };
  }

  protected __delete(
    latest: sigmate.Wiki.BlockAttribs,
    rest: Required<Pick<sigmate.Wiki.BlockAttribs, 'auditedBy'>>
  ): sigmate.Wiki.BlockAttribs {
    const { auditedBy } = rest;
    return {
      ...latest,
      version: Droplet.generate(),
      action: WikiDiff.DELETED,
      diff: {
        type: WikiDiff.DELETED,
        data: WikiDiff.DELETED,
        keyInfo: undefined,
        external: undefined,
      },
      auditedById: auditedBy.id,
      auditedBy,
    };
  }

  protected __load(
    raw: sigmate.Wiki.BlockRawAttribs
  ): sigmate.Wiki.BlockAttribs {
    return WikiBlock.__load(raw);
  }

  protected static __load(
    raw: sigmate.Wiki.BlockRawAttribs
  ): sigmate.Wiki.BlockAttribs {
    const {
      WikiPK,
      WikiSK,
      WikiGSISK,
      ExpiresAt,
      Type: type,
      Data: data,
      KeyInfo: keyInfo,
      Ext: external,
      Version,
      IsLatest: isLatest,
      Action: action,
      Diff,
      DocumentVersion,
      VfCntPosVr,
      VfCntNegBA,
      AuditedBy: auditedById,
      Schema: schema,
    } = raw;

    const document: sigmate.Wiki.BlockAttribs['document'] = {
      id: '',
      version: '',
    };
    const pkMatch = WikiBlock.PK_REGEX.exec(WikiPK);
    if (pkMatch?.groups?.id) {
      document.id = pkMatch.groups.id;
    } else {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_PK',
        message: `PK: ${WikiPK}`,
      });
    }

    const parsedSk = {
      blockId: '',
      documentVersion: '',
      blockVersion: '',
    };
    const skMatch = WikiBlock.SK_REGEX.exec(WikiSK);
    if (skMatch?.groups) {
      if (skMatch.groups.id) {
        parsedSk.blockId = skMatch.groups.id;
      } else {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/IV_SK',
          message: `Block ID not found. SK: ${WikiSK}`,
        });
      }
      if (skMatch.groups.documentVersion) {
        parsedSk.documentVersion = skMatch.groups.documentVersion;
      } else {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/IV_SK',
          message: `Document version not found. SK: ${WikiSK}`,
        });
      }
    } else {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_SK',
        message: `RegEx match failed. SK: ${WikiSK}`,
      });
    }

    const gsiSkMatch = WikiGSISK
      ? WikiBlock.GSI_SK_REGEX.exec(WikiGSISK)
      : null;
    if (gsiSkMatch?.groups) {
      if (gsiSkMatch.groups.id) {
        if (parsedSk.blockId !== gsiSkMatch.groups.id) {
          throw new WikiBlockError({
            code: 'WIKI/BLOCK/IV_GSI_SK',
            message: `Block ID mismatch. SK: ${WikiSK}, GSI_SK: ${WikiGSISK}`,
          });
        }
      } else {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/IV_GSI_SK',
          message: `Block ID not found. GSI_SK: ${WikiGSISK}`,
        });
      }

      if (gsiSkMatch.groups.version) {
        parsedSk.blockVersion = gsiSkMatch.groups.version;
      } else {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/IV_GSI_SK',
          message: `Block version not found. GSI_SK: ${WikiGSISK}`,
        });
      }
    } else if (WikiGSISK) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_GSI_SK',
        message: `RegEx match failed. GSI_SK: ${WikiGSISK}`,
      });
    }

    const id = parsedSk.blockId;

    // Check data type: Original, Cached (latest), Cached (document build)

    const isLatestCache =
      parsedSk.documentVersion === WikiDocument.VERSION_LATEST &&
      parsedSk.blockVersion === WikiBlock.VERSION_LATEST;
    const isBuildCache = parsedSk.documentVersion && !WikiGSISK;

    let cache: sigmate.Wiki.BlockAttribs['cache'] = undefined;

    let version: sigmate.Wiki.BlockAttribs['version'];
    if (isLatestCache || isBuildCache) {
      if (Version) {
        version = Version;
      } else {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/IV_ITEM',
          message: `Version not explicitly set on latest cache. ID: ${id}`,
        });
      }
      if (DocumentVersion) {
        document.version = DocumentVersion;
      } else {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/IV_ITEM',
          message: `Document version not explicitly set on latest cache. ID: ${id}`,
        });
      }

      if (isBuildCache) {
        if (ExpiresAt) {
          cache = {
            documentVersion: parsedSk.documentVersion,
            expiresAt: DateTime.fromSeconds(ExpiresAt),
          };
        } else {
          throw new WikiBlockError({
            code: 'WIKI/BLOCK/IV_ITEM',
            message: `TTL not set on document build cache. ID: ${id}`,
          });
        }
      }
    } else {
      version = parsedSk.blockVersion;
      document.version = parsedSk.documentVersion;
    }

    if (
      version === WikiBlock.VERSION_LATEST ||
      document.version === WikiBlock.VERSION_LATEST
    ) {
      throw new WikiBlockError({
        code: 'WIKI/BLOCK/IV_ITEM',
        message: `Latest: ${isLatestCache}, Build: ${isBuildCache}, ID: ${id}, SK: ${WikiSK}, GSISK: ${WikiGSISK}, Version: ${Version}, DocumentVersion: ${DocumentVersion}`,
      });
    }

    return {
      id,
      type,
      data,
      verificationCount: {
        verify: VfCntPosVr,
        beAware: VfCntNegBA,
      },
      keyInfo,
      external,
      version,
      isLatest,
      action,
      diff: {
        type: Diff.Type,
        data: Diff.Data,
        external: Diff.Ext,
        keyInfo: Diff.KeyInfo,
      },
      auditedById,
      document,
      transposed: undefined,
      cache,
      schema,
    };
  }

  protected __save(
    item: sigmate.Wiki.BlockAttribs,
    option?:
      | typeof WikiBlock['CACHE_LATEST']
      | typeof WikiBlock['CACHE_BUILD']
      | undefined
  ): sigmate.Wiki.BlockRawAttribs {
    return WikiBlock.__save(item, option);
  }

  protected static __save(
    item: sigmate.Wiki.BlockAttribs,
    option?:
      | typeof WikiBlock['CACHE_LATEST']
      | typeof WikiBlock['CACHE_BUILD']
      | undefined
  ): sigmate.Wiki.BlockRawAttribs {
    const {
      id,
      type: Type,
      data: Data,
      verificationCount,
      keyInfo: KeyInfo,
      external: Ext,
      version,
      isLatest: IsLatest,
      action: Action,
      diff,
      auditedById: AuditedBy,
      document,
      cache,
      schema: Schema,
    } = item;

    let WikiSK: sigmate.Wiki.BlockRawAttribs['WikiSK'];
    let WikiGSIPK: sigmate.Wiki.BlockRawAttribs['WikiGSIPK'] = undefined;
    let WikiGSISK: sigmate.Wiki.BlockRawAttribs['WikiGSISK'] = undefined;
    let Version: sigmate.Wiki.BlockRawAttribs['Version'] = undefined;
    let DocumentVersion: sigmate.Wiki.BlockRawAttribs['DocumentVersion'] =
      undefined;
    if (option === WikiBlock.CACHE_LATEST) {
      // Cache (latest)
      WikiSK = WikiKey.getBlockSK(id, WikiDocument.VERSION_LATEST);
      WikiGSIPK = WikiKey.getBlockGSIPK(document.id);
      WikiGSISK = WikiKey.getBlockGSISK(id, WikiBlock.VERSION_LATEST);
      Version = version;
      DocumentVersion = document.version;
    } else if (option === WikiBlock.CACHE_BUILD) {
      // Cache (build)
      if (!cache) {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/IV_ITEM',
          message: `cache attribute not found while trying to save document build cache`,
        });
      }
      WikiSK = WikiKey.getBlockSK(id, cache.documentVersion);
      Version = version;
      DocumentVersion = document.version;
    } else {
      // Original
      WikiSK = WikiKey.getBlockSK(id, document.version);
      WikiGSIPK = WikiKey.getBlockGSIPK(document.id);
      WikiGSISK = WikiKey.getBlockGSISK(id, version);
    }

    return {
      WikiPK: WikiKey.getDocumentPK(document.id),
      WikiSK,
      WikiGSIPK,
      WikiGSISK,
      Type,
      Data,
      KeyInfo,
      Ext,
      Version,
      IsLatest,
      Action,
      Diff: {
        Type: diff.type,
        Data: diff.data,
        Ext: diff.external,
        KeyInfo: diff.keyInfo,
      },
      DocumentVersion,
      VfCntPosVr: verificationCount.verify,
      VfCntNegBA: verificationCount.beAware,
      AuditedBy,
      Schema,
    };
  }

  protected __build(
    item: sigmate.Wiki.BlockAttribs
  ): sigmate.Wiki.BlockResponse {
    const { id, version, auditedBy, ...restItem } = item;

    if (!auditedBy) {
      throw new WikiBlockError('WIKI/BLOCK/ER_BUILD_AUDITED_BY');
    }

    return {
      ...restItem,
      id,
      version,
      auditedBy: auditedBy.toResponse(),
      createdAt: Droplet.getISO(id),
      auditedAt: Droplet.getISO(version),
    };
  }
}
