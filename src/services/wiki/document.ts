import { DOCUMENT_TYPES, WikiKey } from '../../dynamoose/schemas/wiki';
import WikiDocumentError from '../../errors/wiki/document';
import { CommandInput, WikiVCS } from '.';
import WikiDiff from './diff';
import WikiExt from './ext';
import { ActionArgs, ActionMethod } from '../../utils/action';
import DocumentVersion, {
  DocumentVersionItem,
} from '../../dynamoose/models/wiki/DocumentVersion';
import { WikiBlock } from './block';
import { User } from '../../models/User.model';
import Droplet from '../../utils/droplet';
import { forEach, uniq } from 'lodash';
import RequestError from '../../errors/request';
import { WikiDocumentSql } from '../../models/wiki/WikiDocumentRel.model';
import { WikiTag } from '../../models/wiki/WikiTag.model';

type DocumentId = sigmate.Wiki.DocumentId;

export class WikiDocument extends WikiVCS<
  sigmate.Wiki.DocumentRawAttribs,
  sigmate.Wiki.DocumentAttribs,
  sigmate.Wiki.DocumentResponse,
  sigmate.Wiki.DocumentCRequest,
  sigmate.Wiki.DocumentURequest
> {
  public static PK_REGEX = /Document::(?<id>\d+)/;
  public static SK_REGEX = /Document::v_(?<version>\d+)/;
  public static TYPES: sigmate.Wiki.DocumentType[] = DOCUMENT_TYPES;

  ext: WikiExt;
  constructor(id: DocumentId) {
    super(id);
    this.ext = new WikiExt();
  }

  @ActionMethod({
    name: 'WIKI/DOC/LOAD',
    type: 'COMPLEX',
    transaction: false,
  })
  public async load(
    args: {
      version?: string | typeof WikiDocument['VERSION_LATEST'];
      select?: boolean;
      force?: boolean;
    } & ActionArgs = {}
  ): Promise<sigmate.Wiki.DocumentAttribs> {
    const { version, select = true, force = false } = args;
    let document = this.getVersion(version);
    if (!document || force) {
      const rawItem = await DocumentVersion.get(
        {
          WikiPK: WikiKey.getDocumentPK(this.id),
          WikiSK: WikiKey.getDocumentSK(version || WikiDocument.VERSION_LATEST),
        },
        { consistent: false }
      );
      document = this.__load(rawItem);
      this.setVersion(document, { saved: true, select });
    }
    return document;
  }

  public async build(
    args: {
      version?: string | typeof WikiDocument['VERSION_LATEST'];
      select?: boolean;
      force?: boolean;
      loadAuditor?: boolean;
    } & ActionArgs
  ): Promise<sigmate.Wiki.DocumentResponse> {
    const { version, select = true, force = false, loadAuditor } = args;
    const document = await this.load({ version, select, force });
    const blocks = await WikiBlock.loadDocument(this);
    const blockIdMap = new Map<string, WikiBlock>();
    blocks.forEach((block) => {
      blockIdMap.set(block.id, block);
    });

    if (document.isLatest) {
      // Refresh stale caches
      const expiredNames = await this.ext.loadExpired({ document });

      if (document.external && expiredNames.size > 0) {
        const external = document.external;
        const updateDTO: Partial<DocumentVersionItem> = {};
        expiredNames.forEach((name) => {
          switch (name) {
            case 'ExtClName':
            case 'ExtClDiscord':
            case 'ExtClTwitter':
            case 'ExtClTelegram':
            case 'ExtClWebsite':
              updateDTO[name] = WikiExt.toRaw(external[name]);
              break;
            case 'ExtClChains':
              updateDTO[name] = WikiExt.toRaw(external[name]);
              break;
            case 'ExtClMarketplaces':
              updateDTO[name] = WikiExt.toRaw(external[name]);
              break;
            case 'ExtClCategory':
              updateDTO[name] = WikiExt.toRaw(external[name]);
              break;
            case 'ExtClFloorPrice':
              updateDTO[name] = WikiExt.toRaw(external[name]);
              break;
            case 'ExtClMintingPrices':
              updateDTO[name] = WikiExt.mintingPricesToRaw(external[name]);
              break;
          }
        });

        // Update cache to DB
        DocumentVersion.update(
          {
            WikiPK: WikiKey.getDocumentPK(document.id),
            WikiSK: WikiKey.getDocumentSK(document.version),
          },
          updateDTO,
          (err) => {
            if (err) console.error(err);
          }
        );
      }
    }

    const keyInfoPs: Promise<sigmate.Wiki.BlockResponse>[] = [];
    const contentPs: Promise<sigmate.Wiki.BlockResponse>[] = [];

    document.keyInfo.forEach(({ id, diff }) => {
      const block = blockIdMap.get(id);
      if (!block) return;
      keyInfoPs.push(
        block.build({
          select,
          force,
          transposed: diff.transposed,
        })
      );
    });

    document.content.forEach(({ id, diff }) => {
      const block = blockIdMap.get(id);
      if (!block) return;
      contentPs.push(
        block.build({
          select,
          force,
          transposed: diff.transposed,
        })
      );
    });

    const keyInfoRes = await Promise.all(keyInfoPs);
    const contentRes = await Promise.all(contentPs);

    let auditedBy: User | undefined = undefined;
    if (loadAuditor) {
      auditedBy = await User.findByPk(document.auditedById, {
        ...User.FIND_OPTS.public,
        rejectOnEmpty: true,
      });
    }

    return {
      ...document,
      keyInfo: keyInfoRes,
      content: contentRes,
      auditedBy: auditedBy?.toResponse(),
      createdAt: Droplet.getISO(document.id),
      auditedAt: Droplet.getISO(document.version),
    };
  }

  @ActionMethod({
    name: 'WIKI/DOC/CREATE',
    type: 'COMPLEX',
    transaction: true,
  })
  public async create(
    args: {
      request: sigmate.Wiki.DocumentCRequest;
    } & ActionArgs
  ): Promise<CommandInput<sigmate.Wiki.DocumentRawAttribs>> {
    const { request, transaction, action, req } = args;
    const auditedBy = req?.user;
    if (!auditedBy) {
      throw new RequestError('REQ/RJ_UNAUTHENTICATED');
    }
    const { keyInfo, content } = request;

    const id = this.id;
    const version = Droplet.generate();
    const external = new Set<sigmate.Wiki.ExtDataName>();
    request.external = external;

    const kiBlocks: WikiBlock[] = [];
    const contentBlocks: WikiBlock[] = [];

    const kiCreatePs: Promise<CommandInput<sigmate.Wiki.BlockRawAttribs>>[] =
      [];
    const contentCreatePs: Promise<
      CommandInput<sigmate.Wiki.BlockRawAttribs>
    >[] = [];

    keyInfo.forEach((ki) => {
      const block = new WikiBlock(this);
      const create = block.create({
        execute: true,
        request: ki,
        rest: { document: { version } },
      });
      kiBlocks.push(block);
      kiCreatePs.push(create);

      if (ki.keyInfo) {
        const exts = WikiExt.getKIExt(ki.keyInfo.name);
        exts.forEach((ext) => external.add(ext));
      } else {
        throw new WikiDocumentError({
          code: 'WIKI/DOC/CREATE/IV_REQUEST',
          message: `The keyInfo field is required for all keyinfo blocks. (${ki.id})`,
        });
      }

      ki.id = block.id;
    });

    content.forEach((ct) => {
      const block = new WikiBlock(this);
      const create = block.create({
        execute: true,
        request: ct,
        rest: { document: { version } },
      });
      contentBlocks.push(block);
      contentCreatePs.push(create);
      ct.id = block.id;
    });

    const created = this.__create(request, { id, version, auditedBy });
    const createdOriginal = this.__save(created);
    const createdCache = this.__save(created, WikiDocument.CACHE_LATEST);

    const input: CommandInput<sigmate.Wiki.DocumentRawAttribs> = {
      put: [createdOriginal, createdCache],
    };

    const createDocumentPs = this.save({ input, parentAction: action });

    const rel = await WikiDocumentSql.create(
      {
        id: this.id,
        title: request.title,
        collectionId: request.collection?.id,
        nftId: request.collection?.id,
        createdById: auditedBy.id,
      },
      { transaction }
    );

    const tags = uniq(request.tags);
    for (const name of tags) {
      const [tag] = await WikiTag.findOrCreate({
        where: { name },
        defaults: { name, isDefault: false },
        transaction,
      });
      await tag.$add('documents', rel, { transaction });
    }

    await Promise.all([
      // Create document
      createDocumentPs,
      // Create blocks
      ...kiCreatePs,
      ...contentCreatePs,
    ]);

    return input;
  }

  protected __create(
    request: sigmate.Wiki.DocumentCRequest,
    rest: Required<
      Pick<sigmate.Wiki.DocumentAttribs, 'id' | 'version' | 'auditedBy'>
    >
  ): sigmate.Wiki.DocumentAttribs {
    const { type, title, keyInfo, content, external, tags, auditComment } =
      request;
    const { id, version, auditedBy } = rest;

    const tagsDiff: NonNullable<sigmate.Wiki.DocumentDiff['tags']> = {};
    const tagsSet = new Set<string>(tags);
    tagsSet.forEach((tag) => (tagsDiff[tag] = WikiDiff.CREATED));

    const documentExt: sigmate.Wiki.DocumentAttribs['external'] = {};
    external?.forEach((ext) => {
      documentExt[ext] = null;
    });

    return {
      id,
      type,
      title,
      keyInfo: keyInfo.map((ki) => ({
        id: ki.id,
        diff: {
          action: WikiDiff.CREATED,
          transposed: undefined,
        },
      })),
      content: content.map((ct) => ({
        id: ct.id,
        diff: {
          action: WikiDiff.CREATED,
          transposed: undefined,
        },
      })),
      tags: tagsSet,
      external: external ? documentExt : undefined,
      version,
      isLatest: true,
      action: WikiDiff.CREATED,
      diff: {
        type: WikiDiff.CREATED,
        title: WikiDiff.CREATED,
        keyInfo: {
          action: WikiDiff.CREATED,
          transposed: undefined,
        },
        content: {
          action: WikiDiff.CREATED,
          transposed: undefined,
        },
        tags: tagsDiff,
      },
      auditedById: auditedBy.id,
      auditComment,
      auditedBy,
      buildVersionRange: [version, version],
      schema: 1,
    };
  }

  protected __load(
    raw: sigmate.Wiki.DocumentRawAttribs
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
    } = raw;

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
      ExtClDiscord: WikiExt.toItem(ExtClDiscord),
      ExtClTwitter: WikiExt.toItem(ExtClTwitter),
      ExtClTelegram: WikiExt.toItem(ExtClTelegram),
      ExtClWebsite: WikiExt.toItem(ExtClWebsite),
      ExtClChains: WikiExt.toItem(ExtClChains),
      ExtClMarketplaces: WikiExt.toItem(ExtClMarketplaces),
      ExtClCategory: WikiExt.toItem(ExtClCategory),
      ExtClFloorPrice: WikiExt.toItem(ExtClFloorPrice),
      ExtClMintingPrices: WikiExt.mintingPricesToItem(ExtClMintingPrices),
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

  protected __save(
    item: sigmate.Wiki.DocumentAttribs,
    option?: typeof WikiVCS['CACHE_LATEST']
  ): sigmate.Wiki.DocumentRawAttribs {
    const {
      id,
      type: Type,
      title: Title,
      keyInfo,
      content,
      tags: Tags,
      external = {},
      version,
      isLatest: IsLatest,
      action: Action,
      diff,
      auditedById: AuditedBy,
      auditComment: AuditComment,
      buildVersionRange,
      schema: Schema,
    } = item;

    const {
      ExtClId,
      ExtClDiscord,
      ExtClTwitter,
      ExtClTelegram,
      ExtClWebsite,
      ExtClFloorPrice,
      ExtClMintingPrices,
      ExtClChains,
      ExtClMarketplaces,
      ExtClCategory,
      ExtNftId,
    } = external;

    if (option === WikiVCS.CACHE_LATEST && !IsLatest) {
      throw new WikiDocumentError('WIKI/DOC/ER_CACHE_NOT_LATEST');
    }

    return {
      WikiPK: WikiKey.getDocumentPK(id),
      WikiSK: WikiKey.getDocumentSK(
        option === WikiVCS.CACHE_LATEST ? WikiDocument.VERSION_LATEST : version
      ),
      Type,
      Title,
      KeyInfo: keyInfo.map((s) => WikiDiff.toStructureRaw(s)),
      Content: content.map((s) => WikiDiff.toStructureRaw(s)),
      Tags,

      ExtClId: WikiExt.toRaw(ExtClId),
      ExtNftId: WikiExt.toRaw(ExtNftId),
      ExtClDiscord: WikiExt.toRaw(ExtClDiscord),
      ExtClTwitter: WikiExt.toRaw(ExtClTwitter),
      ExtClTelegram: WikiExt.toRaw(ExtClTelegram),
      ExtClWebsite: WikiExt.toRaw(ExtClWebsite),
      ExtClFloorPrice: WikiExt.toRaw(ExtClFloorPrice),
      ExtClChains: WikiExt.toRaw(ExtClChains),
      ExtClMarketplaces: WikiExt.toRaw(ExtClMarketplaces),
      ExtClCategory: WikiExt.toRaw(ExtClCategory),
      ExtClMintingPrices: WikiExt.mintingPricesToRaw(ExtClMintingPrices),

      Version: option === WikiVCS.CACHE_LATEST ? version : undefined,
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
}
