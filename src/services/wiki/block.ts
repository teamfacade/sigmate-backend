import { DateTime } from 'luxon';
import BlockVersion from '../../dynamoose/models/wiki/BlockVersion';
import WikiBlockError from '../../errors/wiki/block';
import { ActionArgs, ActionMethod } from '../../utils/action';
import WikiDocument from './document';
import WikiModel from './model';
import Droplet from '../../utils/droplet';
import RequestError from '../../errors/request';
import WikiDiff from './diff';
import { waitFor } from '../../utils';
import ms from 'ms';

export default class WikiBlock extends WikiModel<
  sigmate.Wiki.BlockRawAttribs,
  sigmate.Wiki.BlockAttribs,
  sigmate.Wiki.BlockCRequest,
  sigmate.Wiki.BlockURequest,
  sigmate.Wiki.BlockResponse
> {
  public static PK_REGEX = WikiDocument.PK_REGEX;
  public static SK_REGEX = /Block::v_(?<documentVersion>)\d+::(?<id>\d+)/;
  public static GSI_PK_REGEX = /BlockHistory::(?<id>\d+)/;
  public static GSI_SK_REGEX = /Block::(?<id>\d+)::v_(?<version>\d+)/;

  public static SUPPORTED_TYPES = [
    'header',
    'paragraph',
    'list',
    'table',
    'image',
    'warning',
  ];

  public static getSK(
    documentVersion: sigmate.Wiki.DocumentVersionId,
    blockId: sigmate.Wiki.BlockId
  ) {
    return `Block::v_${documentVersion}::${blockId}`;
  }

  public static async loadDocument(
    args: { document: WikiDocument } & ActionArgs
  ): Promise<WikiBlock[]> {
    const { document } = args;

    if (document.isLatest) {
      const documentVersion = WikiDocument.VERSION_LATEST;
      const query = BlockVersion.query('WikiPK')
        .eq(WikiDocument.getPK(document.id))
        .and()
        .filter('WikiSK')
        .beginsWith(this.getSK(documentVersion, ''));
      const blockItems = await query.exec();
      const blocks: WikiBlock[] = [];
      blockItems.forEach((blockItem) => {
        const block = new WikiBlock(document);
        block.model = block.__load(blockItem);
        blocks.push(block);
      });
      return blocks;
    } else {
      // TODO load past document versions
      throw new Error('Not implemented: Loading past version of documents');
    }
  }

  document: WikiDocument;
  constructor(document: WikiDocument, id?: string) {
    super(id);
    this.document = document;
  }

  @ActionMethod({
    name: 'WIKI/BLOCK/LOAD',
    type: 'AWS',
  })
  public async load(
    args: {
      version?: string;
      documentVersion?: string;
      consistent?: boolean;
    } & ActionArgs
  ): Promise<sigmate.Wiki.BlockAttribs> {
    const { version, documentVersion, consistent } = args;
    let key: Pick<sigmate.Wiki.WikiAttribs, 'WikiPK' | 'WikiSK'> | undefined =
      undefined;
    let gsiKey:
      | Required<Pick<sigmate.Wiki.WikiAttribs, 'WikiGSIPK' | 'WikiGSISK'>>
      | undefined = undefined;
    if (version) {
      gsiKey = this.getGSIKey(version);
    } else if (documentVersion) {
      key = this.getKey(documentVersion);
    } else {
      // Latest
      key = this.getKey(WikiDocument.VERSION_LATEST);
    }

    const getKey = key || gsiKey;
    if (getKey) {
      const blockItem = await BlockVersion.get(getKey, { consistent });
      const block = this.__load(blockItem);
      return block;
    } else {
      throw new Error('Invalid args: Unable to build key');
    }
  }

  public build(): sigmate.Wiki.BlockResponse {
    return {
      ...this.model,
      auditedBy: this.model.auditedBy?.toResponse(),
      createdAt: Droplet.getISO(this.model.id),
      auditedAt: Droplet.getISO(this.model.version),
    };
  }

  public async create(
    args: {
      request: sigmate.Wiki.BlockCRequest;
      documentVersion: sigmate.Wiki.DocumentVersionId;
    } & ActionArgs
  ): Promise<WikiBlock> {
    const { request, documentVersion, req, action } = args;
    const auditedBy = req?.user;
    if (!auditedBy) {
      throw new RequestError('REQ/RJ_UNAUTHENTICATED');
    }

    const { type, data, keyInfo, external, schema } = request;
    const id = this.id;
    const version = Droplet.generate();

    const block: sigmate.Wiki.BlockAttribs = {
      id,
      type,
      data,
      keyInfo,
      external: external
        ? new Set(external as sigmate.Wiki.ExtDataName[])
        : undefined,
      verificationCount: {
        verify: 0,
        beAware: 0,
      },
      version,
      isLatest: true,
      action: WikiDiff.CREATED,
      diff: {},
      auditedById: auditedBy.id,
      document: {
        id: request.document.id,
        version: documentVersion,
      },
      auditedBy,
      schema,
    };

    this.model = block;

    // (DYNAMO) Create block
    const original = this.__save();
    const cache = this.__save(WikiBlock.CACHE_LATEST);

    let { unprocessedItems: upi } = await BlockVersion.batchPut([
      original,
      cache,
    ]);
    let delay = WikiBlock.BATCH_DELAY;
    while (upi.length > 0) {
      action?.logEvent(
        'warn',
        'ACT/WARNING',
        `BatchPutItem: ${upi.length} unprocessed items. Waiting ${ms(delay)}...`
      );
      await waitFor(delay);
      if (delay < WikiBlock.BATCH_DELAY_MAX) delay *= 2;
      upi = (await BlockVersion.batchPut(upi)).unprocessedItems;
    }

    return this;
  }

  public async update(
    args: {
      request: sigmate.Wiki.BlockURequest;
      documentVersion: sigmate.Wiki.DocumentVersionId;
    } & ActionArgs
  ): Promise<[boolean, sigmate.Wiki.BlockAttribs]> {
    const { request, documentVersion, req, action } = args;
    const auditedBy = req?.user;
    if (!auditedBy) throw new RequestError('REQ/RJ_UNAUTHENTICATED');

    // Load the latest version
    const block = await this.load({ consistent: true });
    const oldOriginalKey = this.getKey(block.document.version);

    const { verificationCount } = block;

    // Calculate diff
    const [type, typeDiff] = WikiDiff.compareBlockType(
      request.type,
      block.type
    );
    const [data, dataDiff] = WikiDiff.compareBlockData(
      request.data,
      block.data
    );
    const [keyInfo, kiDiff] = WikiDiff.compareBlockKI(
      request.keyInfo,
      block.keyInfo
    );
    const [external, extDiff] = WikiDiff.compareBlockExt(
      request.external,
      block.external
    );

    const isUpdated = this.isUpdated(typeDiff, dataDiff, kiDiff, extDiff);
    if (!isUpdated) {
      return [false, block];
    }

    const version = Droplet.generate();
    const diff: sigmate.Wiki.BlockAttribs['diff'] = {
      type: typeDiff,
      data: dataDiff,
      keyInfo: kiDiff,
      external: extDiff,
    };
    const document: sigmate.Wiki.BlockAttribs['document'] = {
      id: this.document.id,
      version: documentVersion,
    };

    this.model = {
      id: this.id,
      type,
      data,
      keyInfo,
      external,
      verificationCount: {
        verify: 0,
        beAware: 0,
      },
      version,
      isLatest: true,
      action: WikiDiff.UPDATED,
      diff,
      auditedById: auditedBy.id,
      document,
      auditedBy,
      schema: request.schema,
    };

    const original = this.__save();
    const cache = this.__save(WikiBlock.CACHE_LATEST);

    await BlockVersion.update(oldOriginalKey, {
      VfCntPosVr: verificationCount.verify,
      VfCntNegBA: verificationCount.beAware,
    });

    let { unprocessedItems: upi } = await BlockVersion.batchPut([
      original,
      cache,
    ]);
    let delay = WikiBlock.BATCH_DELAY;
    while (upi.length > 0) {
      action?.logEvent(
        'warn',
        'ACT/WARNING',
        `BatchPutItem: ${upi.length} unprocessed items. Waiting ${ms(delay)}...`
      );
      await waitFor(delay);
      if (delay < WikiBlock.BATCH_DELAY_MAX) delay *= 2;
      upi = (await BlockVersion.batchPut(upi)).unprocessedItems;
    }

    return [true, this.model];
  }

  public async delete(
    args: { documentVersion: sigmate.Wiki.DocumentVersionId } & ActionArgs
  ): Promise<void> {
    const { documentVersion, req } = args;
    const auditedBy = req?.user;
    if (!auditedBy) throw new RequestError('REQ/RJ_UNAUTHENTICATED');
    const block = await this.load({ consistent: true });
    const originalKey = this.getGSIKey(block.version);

    this.model.version = Droplet.generate();
    this.model.action = WikiDiff.DELETED;
    this.model.diff = {};
    this.model.document.version = documentVersion;

    const cacheItem = new BlockVersion(this.__save(WikiBlock.CACHE_LATEST));
    await cacheItem.save();
    await BlockVersion.update(originalKey, {
      VfCntPosVr: block.verificationCount.verify,
      VfCntNegBA: block.verificationCount.beAware,
      IsLatest: false,
    });
  }

  protected __load(
    dynamo: sigmate.Wiki.BlockRawAttribs
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
    } = dynamo;

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
      parsedSk.documentVersion === WikiDocument.VERSION_LATEST ||
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
          message: `Version not explicitly set on cache of block ${id}`,
        });
      }
    } else {
      version = parsedSk.blockVersion;
      document.version = parsedSk.documentVersion;
    }

    if (isLatestCache) {
      document.version = parsedSk.documentVersion;
    } else if (isBuildCache) {
      if (DocumentVersion) {
        document.version = DocumentVersion;
      } else {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/IV_ITEM',
          message: `Document version not explicitly set on document build cache of block ${id}`,
        });
      }

      if (ExpiresAt) {
        cache = {
          documentVersion: parsedSk.documentVersion,
          expiresAt: DateTime.fromSeconds(ExpiresAt),
        };
      } else {
        throw new WikiBlockError({
          code: 'WIKI/BLOCK/IV_ITEM',
          message: `TTL not set on document build cache of block ${id}`,
        });
      }
    } else {
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
      cache,
      schema,
    };
  }

  protected __save(
    cache?: 'latest' | 'build' | undefined
  ): sigmate.Wiki.BlockRawAttribs {
    const {
      type: Type,
      data: Data,
      keyInfo: KeyInfo,
      external: Ext,
      verificationCount,
      version,
      isLatest: IsLatest,
      action: Action,
      diff,
      auditedById: AuditedBy,
      document,
      cache: buildCache,
      schema: Schema,
    } = this.model;

    const WikiPK = this.getPK();
    let WikiSK: sigmate.Wiki.BlockRawAttribs['WikiSK'];
    let WikiGSIPK: sigmate.Wiki.BlockRawAttribs['WikiGSIPK'] = undefined;
    let WikiGSISK: sigmate.Wiki.BlockRawAttribs['WikiGSISK'] = undefined;
    let Version: sigmate.Wiki.BlockRawAttribs['Version'] = undefined;
    let DocumentVersion: sigmate.Wiki.BlockRawAttribs['DocumentVersion'] =
      undefined;

    if (cache === WikiBlock.CACHE_LATEST) {
      WikiSK = this.getSK(WikiDocument.VERSION_LATEST);
      WikiGSIPK = this.getGSIPK();
      WikiGSISK = this.getGSISK(WikiBlock.VERSION_LATEST);
      Version = version;
      DocumentVersion = document.version;
    } else if (cache === WikiBlock.CACHE_BUILD) {
      if (buildCache) {
        WikiSK = this.getSK(buildCache.documentVersion);
      } else {
        throw new Error('Build cache missing cache attribute');
      }
      Version = version;
      DocumentVersion = document.version;
    } else {
      WikiSK = this.getSK(document.version);
      WikiGSIPK = this.getGSIPK();
      WikiGSISK = this.getGSISK(version);
    }

    return {
      WikiPK,
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

  private isUpdated(
    typeDiff: sigmate.Wiki.BlockDiff['type'] | undefined,
    dataDiff: sigmate.Wiki.BlockDiff['data'] | undefined,
    kiDiff: sigmate.Wiki.BlockDiff['keyInfo'] | undefined,
    extDiff: sigmate.Wiki.BlockDiff['external'] | undefined
  ) {
    if (typeDiff !== WikiDiff.NO_CHANGE) {
      return true;
    }
    if (dataDiff !== WikiDiff.NO_CHANGE) {
      return true;
    }
    if (kiDiff !== WikiDiff.NO_CHANGE) {
      return true;
    }
    if (extDiff) {
      for (const name in extDiff) {
        if (extDiff[name] !== WikiDiff.NO_CHANGE) {
          return true;
        }
      }
    }

    return false;
  }

  private getKey(
    documentVersion: sigmate.Wiki.DocumentVersionId
  ): Pick<sigmate.Wiki.WikiAttribs, 'WikiPK' | 'WikiSK'> {
    return {
      WikiPK: this.getPK(),
      WikiSK: this.getSK(documentVersion),
    };
  }

  private getGSIKey(
    version: sigmate.Wiki.BlockVersionId
  ): Required<Pick<sigmate.Wiki.WikiAttribs, 'WikiGSIPK' | 'WikiGSISK'>> {
    return {
      WikiGSIPK: this.getGSIPK(),
      WikiGSISK: this.getGSISK(version),
    };
  }

  private getPK() {
    return WikiDocument.getPK(this.document.id);
  }

  private getSK(
    documentVersion: sigmate.Wiki.DocumentVersionId
  ): sigmate.Wiki.WikiAttribs['WikiSK'] {
    return WikiBlock.getSK(documentVersion, this.id);
  }

  private getGSIPK() {
    return `BlockHistory::${this.document.id}`;
  }

  private getGSISK(version: sigmate.Wiki.BlockVersionId) {
    return `Block::${this.id}::v_${version}`;
  }
}
