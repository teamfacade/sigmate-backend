import { forEach, omit } from 'lodash';
import ms from 'ms';
import DocumentVersion from '../../dynamoose/models/wiki/DocumentVersion';
import { ActionArgs, ActionMethod } from '../../utils/action';
import WikiDiff from './diff';
import WikiModel from './model';
import WikiDocumentError from '../../errors/wiki/document';
import { Collection } from '../../models/chain/Collection.model';
import WikiEDS from './eds';
import WikiBlock from './block';
import Droplet from '../../utils/droplet';
import RequestError from '../../errors/request';
import { WikiTag } from '../../models/wiki/WikiTag.model';
import { WikiDocumentSql } from '../../models/wiki/WikiDocumentSql.model';
import { waitFor } from '../../utils';

export default class WikiDocument extends WikiModel<
  sigmate.Wiki.DocumentRawAttribs,
  sigmate.Wiki.DocumentAttribs,
  sigmate.Wiki.DocumentCRequest,
  sigmate.Wiki.DocumentURequest,
  sigmate.Wiki.DocumentResponse
> {
  public static PK_REGEX = /Document::(?<id>\d+)/;
  public static SK_REGEX = /Document::v_(?<version>\d+)/;

  public static getKey(
    id: string,
    version: string
  ): Pick<sigmate.Wiki.WikiAttribs, 'WikiPK' | 'WikiSK'> {
    return {
      WikiPK: this.getPK(id),
      WikiSK: this.getSK(version),
    };
  }

  public static getPK(id: string) {
    return `Document::${id}`;
  }

  public static getSK(version: string) {
    return `Document::v_${version}`;
  }

  eds: WikiEDS;
  blocks: Map<sigmate.Wiki.BlockId, WikiBlock>;

  constructor(id?: string) {
    super(id);
    this.eds = new WikiEDS();
    this.blocks = new Map();
  }

  @ActionMethod({
    name: 'WIKI/DOC/LOAD',
    type: 'COMPLEX',
    transaction: false,
  })
  public async load(
    args: {
      version?: string;
      consistent?: boolean;
    } & ActionArgs
  ): Promise<sigmate.Wiki.DocumentAttribs> {
    const { version = WikiDocument.VERSION_LATEST, consistent, action } = args;
    const key = this.getKey(version);
    action?.addTarget({
      model: 'SigmateWiki::Document::Document',
      id: `${key.WikiPK} / ${key.WikiSK}`,
    });

    const dynamo = await DocumentVersion.get(key, { consistent });
    const document = this.__load(dynamo);
    this.model = document;
    await this.loadExt({ parentAction: action });
    this.saveExt({ parentAction: action }); // Do not await

    const blocks = await WikiBlock.loadDocument({ document: this });
    this.blocks.clear();
    blocks.forEach((block) => this.blocks.set(block.id, block));

    return document;
  }

  public build(): sigmate.Wiki.DocumentResponse {
    const { keyInfo, content, tags } = this.model;

    return {
      ...omit(this.model, [
        'keyInfo',
        'content',
        'tags',
        'buildVersionRange',
        'auditedById',
        'auditedBy',
      ]),
      keyInfo: keyInfo.map(({ id }) => this.getBlock(id).build()),
      content: content.map(({ id }) => this.getBlock(id).build()),
      tags: Array.from(tags),
      auditedBy: this.model.auditedBy?.toResponse(),
      createdAt: Droplet.getISO(this.id),
      auditedAt: Droplet.getISO(this.version),
    };
  }

  @ActionMethod({
    name: 'WIKI/DOC/CREATE',
    type: 'COMPLEX',
  })
  public async create(
    args: { request: sigmate.Wiki.DocumentCRequest } & ActionArgs
  ): Promise<WikiDocument> {
    const { request, req, transaction, action } = args;
    const auditedBy = req?.user;
    if (!auditedBy) throw new RequestError('REQ/RJ_UNAUTHENTICATED');

    const { type, title, collection, auditComment, schema } = request;

    // Create entry in SQL DB
    const sqlErrors: unknown[] = [];

    // (SQL) Create Document
    const documentSql = await WikiDocumentSql.create(
      { id: this.id },
      { transaction }
    );
    if (collection) {
      const [affectedCount] = await Collection.update(
        {
          document: this.id,
        },
        { where: { id: collection.id }, transaction }
      );
      if (!affectedCount) {
        throw new Error('Collection not found');
      }
    }

    // (SQL) Find or create tags
    const tags = new Set(request.tags);
    if (tags.size > 0) {
      tags.forEach((name) => {
        if (sqlErrors.length > 0) return;
        WikiTag.findOrCreate({
          where: { name },
          defaults: { name },
          transaction,
        })
          .then(([tag]) => {
            if (sqlErrors.length > 0) return;
            // (SQL) Associate tags with document
            tag
              .$add('documents', documentSql, { transaction })
              .catch((error) => {
                sqlErrors.push(error);
              });
          })
          .catch((error) => {
            sqlErrors.push(error);
          });
      });
    }

    // On SQL error, stop here
    if (sqlErrors.length > 0) {
      action?.logErrors(sqlErrors);
      throw sqlErrors[0];
    }

    const id = this.id;
    const version = Droplet.generate();
    const external: sigmate.Wiki.DocumentAttribs['external'] = {};

    // (DYNAMO) Create blocks
    const kiBlockPs: Promise<WikiBlock>[] = request.keyInfo.map((request) => {
      const block = new WikiBlock(this);
      if (request.keyInfo) {
        this.eds.getKIExt(request.keyInfo.name).forEach((name) => {
          external[name] = null;
        });
      }
      return block.create({ request, documentVersion: version });
    });
    const keyInfoBlocks = await Promise.all(kiBlockPs);
    const ctBlockPs: Promise<WikiBlock>[] = request.content.map((request) =>
      new WikiBlock(this).create({ request, documentVersion: version })
    );
    const contentBlocks = await Promise.all(ctBlockPs);
    const keyInfo: sigmate.Wiki.DocumentAttribs['keyInfo'] = keyInfoBlocks.map(
      (block) => {
        this.blocks.set(block.id, block);
        return { id: block.id, diff: { action: WikiDiff.CREATED } };
      }
    );
    const content: sigmate.Wiki.DocumentAttribs['content'] = contentBlocks.map(
      (block) => {
        this.blocks.set(block.id, block);
        return { id: block.id, diff: { action: WikiDiff.CREATED } };
      }
    );

    // Build document model
    this.model = {
      id,
      type,
      title,
      keyInfo,
      content,
      tags,
      external,
      version,
      isLatest: true,
      action: WikiDiff.CREATED,
      diff: {},
      auditedById: auditedBy.id,
      auditComment,
      auditedBy,
      collection,
      buildVersionRange: [version, version],
      schema,
    };

    // Update external data
    await this.loadExt({ parentAction: action });

    // (DYNAMO) Create document item and latest version cache
    const original = this.__save();
    const cache = this.__save(WikiDocument.CACHE_LATEST);

    let { unprocessedItems: upi } = await DocumentVersion.batchPut([
      original,
      cache,
    ]);
    let delay = WikiDocument.BATCH_DELAY;
    while (upi.length > 0) {
      action?.logEvent(
        'warn',
        'ACT/WARNING',
        `BatchPutItem: ${upi.length} unprocessed items. Waiting ${ms(delay)}...`
      );
      await waitFor(delay);
      if (delay < WikiDocument.BATCH_DELAY_MAX) delay *= 2;
      upi = (await DocumentVersion.batchPut(upi)).unprocessedItems;
    }

    // TODO DynamoDB rollback on error

    return this;
  }

  @ActionMethod({
    name: 'WIKI/DOC/UPDATE',
    type: 'COMPLEX',
  })
  public async update(
    args: { request: sigmate.Wiki.DocumentURequest } & ActionArgs
  ): Promise<[boolean, sigmate.Wiki.DocumentAttribs]> {
    const { request, req, transaction, action } = args;
    const auditedBy = req?.user;
    if (!auditedBy) throw new RequestError('REQ/RJ_UNAUTHENTICATED');

    const { id, auditComment, schema } = request;
    if (id !== this.id) throw new Error('ID mismatch');

    const document = await this.load({ consistent: true });
    const oldOriginalKey = this.getKey();
    const version = Droplet.generate();

    const [type, typeDiff] = WikiDiff.compareDocumentType(
      request.type,
      document.type
    );
    const [title, titleDiff] = WikiDiff.compareDocumentTitle(
      request.title,
      document.title
    );
    const [keyInfo, kiDiff] = WikiDiff.compareDocumentKI(
      request.keyInfo,
      document.keyInfo
    );
    const [content, ctDiff] = WikiDiff.compareDocumentContent(
      request.content,
      document.content
    );
    const [tags, tagsDiff] = WikiDiff.compareDocumentTags(
      request.tags,
      document.tags
    );

    // SQL (Update document tags)
    const documentSql = await WikiDocumentSql.findByPk(this.id, {
      rejectOnEmpty: true,
      transaction,
    });

    for (const name in tagsDiff) {
      const action = tagsDiff[name];
      if (action === WikiDiff.CREATED) {
        const [tag] = await WikiTag.findOrCreate({
          where: { name },
          defaults: { name },
          transaction,
        });
        await documentSql.$add('tags', tag, { transaction });
      } else if (action === WikiDiff.DELETED) {
        const tag = await WikiTag.findOne({
          where: { name },
          transaction,
        });
        if (tag) {
          await documentSql.$remove('tags', tag, { transaction });
        }
      }
    }

    // Create, update or delete blocks
    const updatedBlockIds = new Set<sigmate.Wiki.BlockId>();
    for (const blockRequests of [request.keyInfo, request.content]) {
      for (const blockRequest of blockRequests || []) {
        const blockId = blockRequest.id;
        if (this.blocks.has(blockId)) {
          // UPDATE
          const block: WikiBlock = this.getBlock(blockId);
          const [updated] = await block.update({
            request: blockRequest,
            documentVersion: version,
            parentAction: action,
          });
          if (updated) updatedBlockIds.add(blockId);
        } else {
          // CREATE
          const block: WikiBlock = new WikiBlock(this);
          await block.create({
            request: blockRequest,
            documentVersion: version,
            parentAction: action,
          });
          this.blocks.set(block.id, block);
        }
      }
    }
    for (const diffs of [keyInfo, content]) {
      for (const { id, diff } of diffs) {
        if (diff.action === WikiDiff.DELETED) {
          // DELETE
          await this.blocks
            .get(id)
            ?.delete({ documentVersion: version, parentAction: action });
          this.blocks.delete(id);
        } else if (diff.action === WikiDiff.NO_CHANGE) {
          // Mark updated blocks as updated
          if (updatedBlockIds.has(id)) {
            diff.action = WikiDiff.UPDATED;
          }
        }
      }
    }

    // Check if anything actually changed
    const isUpdated = this.isUpdated({
      type: typeDiff,
      title: titleDiff,
      keyInfo: kiDiff,
      content: ctDiff,
    });

    // If nothing was changed, no need to continue further
    if (!isUpdated) {
      return [false, document];
    }

    // Compute build version range
    let buildVersionStart: sigmate.Wiki.DocumentVersionId | undefined =
      undefined;
    let buildVersionEnd: sigmate.Wiki.DocumentVersionId | undefined = undefined;
    this.blocks.forEach((block) => {
      if (!buildVersionStart || buildVersionStart > block.document.version) {
        buildVersionStart = block.document.version;
      }
      if (!buildVersionEnd || buildVersionEnd < block.document.version) {
        buildVersionEnd = block.document.version;
      }
    });
    // If there are no blocks, set range as current version
    if (!buildVersionStart) buildVersionStart = version;
    if (!buildVersionEnd) buildVersionEnd = version;

    // Update document model
    this.model = {
      id: this.id,
      type,
      title,
      keyInfo,
      content,
      tags,
      external: document.external,
      version,
      isLatest: true,
      action: isUpdated ? WikiDiff.UPDATED : WikiDiff.NO_CHANGE,
      diff: {
        type: typeDiff,
        title: titleDiff,
        keyInfo: kiDiff,
        content: ctDiff,
        tags: tagsDiff,
      },
      auditedById: auditedBy.id,
      auditComment,
      auditedBy,
      collection: document.collection,
      buildVersionRange: [buildVersionStart, buildVersionEnd],
      schema: schema || document.schema,
    };

    // Generate Dynamo item
    const original = this.__save();
    const cache = this.__save(WikiDocument.CACHE_LATEST);

    // Send queries to DynamoDB
    await DocumentVersion.update(oldOriginalKey, { IsLatest: false });
    let { unprocessedItems: upi } = await DocumentVersion.batchPut([
      original,
      cache,
    ]);
    let delay = WikiDocument.BATCH_DELAY;
    while (upi.length > 0) {
      action?.logEvent(
        'warn',
        'ACT/WARNING',
        `BatchPutItem: ${upi.length} unprocessed items. Waiting ${ms(delay)}...`
      );
      await waitFor(delay);
      if (delay < WikiDocument.BATCH_DELAY_MAX) delay *= 2;
      upi = (await DocumentVersion.batchPut(upi)).unprocessedItems;
    }

    // TODO DynamoDB rollback on failure

    return [true, this.model];
  }

  @ActionMethod({
    name: 'WIKI/DOC/DELETE',
    type: 'COMPLEX',
  })
  public async delete(args: ActionArgs = {}): Promise<void> {
    const { req, transaction } = args;
    const auditedBy = req?.user;
    if (!auditedBy) throw new RequestError('REQ/RJ_UNAUTHENTICATED');

    // Load latest version
    const documentPs = this.load({ consistent: true });

    // (SQL) Delete
    const documentSql = await WikiDocumentSql.findByPk(this.id, {
      rejectOnEmpty: true,
      transaction,
    });
    await documentSql.$set('tags', [], { transaction });
    await documentSql.destroy({ transaction });

    const document = await documentPs;
    const version = Droplet.generate();
    const oldOriginalKey = this.getKey();

    document.version = version;
    document.action = WikiDiff.DELETED;
    document.diff = {};
    document.auditedById = auditedBy.id;
    document.auditComment = '';
    document.auditedBy = auditedBy;

    const latest = this.__save(WikiDocument.CACHE_LATEST);
    await DocumentVersion.update(oldOriginalKey, { IsLatest: false });
    await DocumentVersion.update(latest);
  }

  @ActionMethod({
    name: 'WIKI/DOC/LOAD_EXT',
    type: 'DB',
  })
  private async loadExt(args: ActionArgs = {}) {
    const { transaction } = args;
    const document = this.model;
    const { collection } = this.eds.getExpired(document);
    if (collection) {
      const { attributes, include } = collection;
      if (document.collection) {
        this.eds.collection = await Collection.findByPk(
          document.collection.id,
          {
            transaction,
            attributes,
            include,
            rejectOnEmpty: true,
          }
        );
      } else {
        throw new Error('Collection not in document');
      }
    }
    document.external = this.eds.updateExpired(document);
  }

  @ActionMethod({
    name: 'WIKI/DOC/SAVE_EXT',
    type: 'AWS',
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private saveExt(args: ActionArgs = {}) {
    return DocumentVersion.update(
      this.getKey(WikiDocument.VERSION_LATEST),
      this.__saveExt()
    );
  }

  protected __load(
    dynamo: sigmate.Wiki.DocumentRawAttribs
  ): sigmate.Wiki.DocumentAttribs {
    const {
      WikiPK,
      WikiSK,
      Type: type,
      Title: title,
      KeyInfo,
      Content,
      Tags: tags,
      ExtClDiscord,
      ExtClTwitter,
      ExtClTelegram,
      ExtClWebsite,
      ExtClChains,
      ExtClMarketplaces,
      ExtClCategory,
      ExtClFloorPrice,
      ExtClMintingPrices,
      Version,
      IsLatest: isLatest,
      BuildVersionStart,
      BuildVersionEnd,
      Action: action,
      Diff,
      AuditedBy: auditedById,
      AuditComment: auditComment,
      Schema: schema,
    } = dynamo;

    // Parse ID
    let id: sigmate.Wiki.DocumentAttribs['id'];
    const pkMatch = WikiDocument.PK_REGEX.exec(WikiPK);
    if (pkMatch?.groups?.id) {
      id = pkMatch.groups.id;
    } else {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/IV_PK',
        message: `PK: ${WikiPK}`,
      });
    }

    let version: sigmate.Wiki.DocumentAttribs['version'];
    const skMatch = WikiDocument.SK_REGEX.exec(WikiSK);
    if (skMatch?.groups?.version) {
      version = skMatch.groups.version;
      if (version === WikiDocument.VERSION_LATEST) {
        if (Version) {
          version = Version;
        } else {
          throw new WikiDocumentError({
            code: 'WIKI/DOC/ER_ITEM',
            message: 'Version not explicitly set at latest cache',
          });
        }
      }
    } else {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/IV_SK',
        message: `SK: ${WikiSK}`,
      });
    }

    const external: sigmate.Wiki.DocumentAttribs['external'] = {
      ExtClDiscord: WikiEDS.fromDynamo(ExtClDiscord),
      ExtClTwitter: WikiEDS.fromDynamo(ExtClTwitter),
      ExtClTelegram: WikiEDS.fromDynamo(ExtClTelegram),
      ExtClWebsite: WikiEDS.fromDynamo(ExtClWebsite),
      ExtClChains: WikiEDS.fromDynamo(ExtClChains),
      ExtClMarketplaces: WikiEDS.fromDynamo(ExtClMarketplaces),
      ExtClCategory: WikiEDS.fromDynamo(ExtClCategory),
      ExtClFloorPrice: WikiEDS.fromDynamo(ExtClFloorPrice),
      ExtClMintingPrices: WikiEDS.mintingPricesFromDynamo(ExtClMintingPrices),
    };

    let extCount = 0;
    forEach(external, (ext) => {
      if (ext) extCount++;
    });

    return {
      id,
      type,
      title,
      keyInfo: KeyInfo.map((sr) => WikiDiff.toStructure(sr)),
      content: Content.map((sr) => WikiDiff.toStructure(sr)),
      tags,
      external: extCount > 0 ? external : undefined,
      version,
      isLatest,
      action,
      diff: {
        type: Diff.Type,
        title: Diff.Title,
        keyInfo: Diff.KeyInfo ? WikiDiff.toResult(Diff.KeyInfo) : undefined,
        content: Diff.Content ? WikiDiff.toResult(Diff.Content) : undefined,
        tags: Diff.Tags,
      },
      auditedById,
      auditComment,
      buildVersionRange: [BuildVersionStart, BuildVersionEnd],
      schema,
    };
  }

  private __saveExt() {
    const external = this.model.external || {};
    const {
      ExtClDiscord,
      ExtClTwitter,
      ExtClTelegram,
      ExtClWebsite,
      ExtClFloorPrice,
      ExtClMintingPrices,
      ExtClChains,
      ExtClMarketplaces,
      ExtClCategory,
    } = external;

    return {
      ExtClDiscord: WikiEDS.toDynamo(ExtClDiscord),
      ExtClTwitter: WikiEDS.toDynamo(ExtClTwitter),
      ExtClTelegram: WikiEDS.toDynamo(ExtClTelegram),
      ExtClWebsite: WikiEDS.toDynamo(ExtClWebsite),
      ExtClFloorPrice: WikiEDS.toDynamo(ExtClFloorPrice),
      ExtClChains: WikiEDS.toDynamo(ExtClChains),
      ExtClMarketplaces: WikiEDS.toDynamo(ExtClMarketplaces),
      ExtClCategory: WikiEDS.toDynamo(ExtClCategory),
      ExtClMintingPrices: WikiEDS.mintingPricesToDynamo(ExtClMintingPrices),
    };
  }

  protected __save(
    cache?: 'latest' | 'build' | undefined
  ): sigmate.Wiki.DocumentRawAttribs {
    const {
      type: Type,
      title: Title,
      keyInfo,
      content,
      tags: Tags,
      version,
      isLatest: IsLatest,
      action: Action,
      diff,
      auditedById: AuditedBy,
      auditComment: AuditComment,
      buildVersionRange,
      schema: Schema,
    } = this.model;

    if (cache === WikiDocument.CACHE_LATEST && !IsLatest) {
      throw new WikiDocumentError('WIKI/DOC/ER_CACHE_NOT_LATEST');
    }

    const external =
      cache === WikiDocument.CACHE_LATEST ? this.__saveExt() : {};

    return {
      WikiPK: this.getPK(),
      WikiSK:
        cache === WikiDocument.CACHE_LATEST
          ? this.getSK(WikiDocument.VERSION_LATEST)
          : this.getSK(),
      Type,
      Title,
      KeyInfo: keyInfo.map((s) => WikiDiff.toStructureRaw(s)),
      Content: content.map((s) => WikiDiff.toStructureRaw(s)),
      Tags,
      ...external,
      Version: cache === WikiDocument.CACHE_LATEST ? version : undefined,
      IsLatest,
      BuildVersionStart: buildVersionRange[0],
      BuildVersionEnd: buildVersionRange[1],
      Action,
      Diff: {
        Type: diff.type,
        Title: diff.title,
        KeyInfo: diff.keyInfo ? WikiDiff.toResultRaw(diff.keyInfo) : undefined,
        Content: diff.content ? WikiDiff.toResultRaw(diff.content) : undefined,
        Tags: diff.tags,
      },
      AuditedBy,
      AuditComment,
      Schema,
    };
  }

  private isUpdated(diff: sigmate.Wiki.DocumentAttribs['diff']) {
    const { type, title, keyInfo, content, tags } = diff;
    if (type !== WikiDiff.NO_CHANGE) return true;
    if (title !== WikiDiff.NO_CHANGE) return true;
    if (keyInfo) {
      if (keyInfo.action !== WikiDiff.NO_CHANGE) return true;
      if (keyInfo.transposed === WikiDiff.TRANSPOSED) return true;
    }
    if (content) {
      if (content.action !== WikiDiff.NO_CHANGE) return true;
      if (content.transposed === WikiDiff.TRANSPOSED) return true;
    }
    if (tags) {
      for (const name of Object.keys(tags)) {
        if (tags[name] && tags[name] !== WikiDiff.NO_CHANGE) {
          return true;
        }
      }
    }
    return false;
  }

  private getKey(version?: string) {
    return WikiDocument.getKey(this.id, version || this.version);
  }

  private getPK() {
    return WikiDocument.getPK(this.id);
  }

  private getSK(version?: string) {
    return WikiDocument.getSK(version || this.version);
  }

  private getBlock(id: sigmate.Wiki.BlockId) {
    const block = this.blocks.get(id);
    if (!block) throw new Error(`Block not found (ID: ${id})`);
    return block;
  }
}
