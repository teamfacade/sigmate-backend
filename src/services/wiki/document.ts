import { WikiKey } from '../../dynamoose/schemas/wiki';
import { WikiDocumentRel } from '../../models/wiki/WikiDocumentRel.model';
import DocumentVersion from '../../dynamoose/models/wiki/DocumentVersion';
import WikiDocumentError from '../../errors/wiki/document';
import Droplet from '../../utils/droplet';
import { ActionArgs, ActionMethod } from '../../utils/action';
import { User } from '../../models/User.model';
import { WikiBlock } from './block';
import { BuildArgs, LoadItemArgs, WikiVCS } from '.';
import WikiExt from './ext';

type DocumentId = sigmate.Wiki.DocumentId;
type DocumentVersionId = sigmate.Wiki.DocumentVersionId;
type DocumentRawItemAttribs = sigmate.Wiki.DocumentRawItemAttribs;
type DocumentItemAttribs = sigmate.Wiki.DocumentItemAttribs;
type DocumentBuildAttribs = sigmate.Wiki.DocumentBuildAttribs;

export class WikiDocument extends WikiVCS<
  DocumentRawItemAttribs,
  DocumentItemAttribs,
  DocumentBuildAttribs,
  DocumentId,
  DocumentVersionId
> {
  public static PK_REGEX = /Document::(?<id>\d+)/;
  public static SK_REGEX = /Document::v_(?<version>\d+)/;
  public static AUDIT_ACTIONS = new Set(['create', 'update', 'delete']);
  public static STRUCTURE_AUDIT_ACTIONS = new Set([
    'create',
    'update',
    'delete',
    'move',
  ]);

  constructor(id: DocumentId) {
    super(id);
  }

  @ActionMethod({
    name: 'WIKI/DOC/BUILD',
    type: 'COMPLEX',
    transaction: false,
  })
  public async build(
    args: BuildArgs<DocumentVersionId> & ActionArgs
  ): Promise<DocumentBuildAttribs> {
    const { options, transaction, action } = args;
    const { extData, force, select } = options;
    const version = this.getVersionId(args.version);

    // Load document and blocks from DynamoDB
    const documentPromise = this.loadItem({ version, force, select });
    const blocksPromise = WikiBlock.loadDocumentBlocks({
      document: { id: this.id, version },
    });
    const relationsPromise = WikiDocumentRel.findByPk(this.id, {
      transaction,
      rejectOnEmpty: true,
    });
    const ext = extData || new WikiExt();
    const [document, blocks, relations] = await Promise.all([
      documentPromise,
      blocksPromise,
      relationsPromise,
    ]);

    // Update external data
    const relationsJSON = relations.toJSON();
    ext.collectionId = relationsJSON.collectionId;
    ext.nftId = relationsJSON.nftId;
    await ext.updateBlocks({ blocks, parentAction: action });

    // Convert BlockStructure array to BlockBuild
    const blockMap = new Map<sigmate.Wiki.BlockId, WikiBlock>();
    blocks.forEach((block) => blockMap.set(block.id, block));
    const keyInfoPromises = document.keyInfo.map(async (blockStructure) => {
      const block = blockMap.get(blockStructure.id);
      if (!block) {
        throw new WikiDocumentError({
          code: 'WIKI/DOC/ER_BUILD_NF_BLOCK',
          message: `KI ID: ${blockStructure.id}`,
        });
      }
      return await block.build({ options: { blockStructure } });
    });
    const contentPromises = document.content.map(async (blockStructure) => {
      const block = blockMap.get(blockStructure.id);
      if (!block) {
        throw new WikiDocumentError({
          code: 'WIKI/DOC/ER_BUILD_NF_BLOCK',
          message: `Content ID: ${blockStructure.id}`,
        });
      }
      return await block.build({ options: { blockStructure } });
    });

    const auditedBy = User.findByPk(document.auditedById, {
      transaction,
      rejectOnEmpty: true,
    });

    return {
      ...document,
      keyInfo: await Promise.all(keyInfoPromises),
      content: await Promise.all(contentPromises),
      tags: document.tags.map((name) => ({ name })),
      auditedBy: await auditedBy,
    };
  }

  @ActionMethod({
    name: 'WIKI/DOC/LOAD_ITEM',
    type: 'AWS',
  })
  protected async loadItem(
    args: LoadItemArgs<DocumentVersionId> & ActionArgs
  ): Promise<DocumentItemAttribs> {
    const { force } = args;
    const version = this.getVersionId(args.version); // Document version Id
    let item = this.getItem(version);
    if (!item || force) {
      const rawItem = await DocumentVersion.get(
        {
          WikiPK: WikiKey.getDocumentPK(this.id),
          WikiSK: WikiKey.getDocumentSK(version),
        },
        { consistent: false }
      );
      item = this.toItem(rawItem);
    }
    this.setItem(item);
    return item;
  }

  protected static toRawItem(
    item: DocumentItemAttribs
  ): DocumentRawItemAttribs {
    const {
      id,
      type,
      title,
      keyInfo,
      content,
      tags,
      version,
      documentAction,
      attribActions,
      auditedById,
      auditComment,
      isLatestCache,
    } = item;

    return {
      WikiPK: WikiKey.getDocumentPK(id),
      WikiSK: isLatestCache
        ? WikiKey.getDocumentSK(WikiDocument.VERSION_LATEST)
        : WikiKey.getDocumentSK(version),
      Type: type,
      Title: title,
      KeyInfo: keyInfo,
      Content: content,
      Tags: tags,
      DocumentVersion: isLatestCache ? version : undefined,
      DocumentAction: documentAction,
      AttribActions: attribActions,
      AuditedBy: auditedById,
      AuditComment: auditComment,
    };
  }

  protected toRawItem(item: DocumentItemAttribs): DocumentRawItemAttribs {
    return WikiDocument.toRawItem(item);
  }

  protected static toItem(
    rawItem: DocumentRawItemAttribs
  ): DocumentItemAttribs {
    const {
      WikiPK,
      WikiSK,
      Type,
      Title,
      KeyInfo,
      Content,
      Tags,
      DocumentVersion,
      DocumentAction,
      AttribActions,
      AuditedBy,
      AuditComment,
    } = rawItem;

    const pkMatch = WikiDocument.PK_REGEX.exec(WikiPK);
    let id: DocumentItemAttribs['id'] | undefined = undefined;
    if (pkMatch) {
      id = pkMatch.groups?.id;
    }
    if (!pkMatch || id === undefined) {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/IV_PK',
        message: `PK: ${WikiPK}`,
      });
    }

    const skMatch = WikiDocument.SK_REGEX.exec(WikiSK);
    let version: DocumentItemAttribs['version'] | undefined = undefined;
    let isLatestCache = false;
    if (skMatch) {
      version = skMatch.groups?.version;
      if (version === WikiDocument.VERSION_LATEST) {
        isLatestCache = true;
        version = DocumentVersion;
      }
    }
    if (!skMatch || version === undefined) {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/IV_SK',
        message: `SK: ${WikiSK}`,
      });
    }

    const createdAt = Droplet.getDateTime(id);
    const auditedAt = Droplet.getDateTime(version);

    return {
      id,
      type: Type,
      title: Title,
      keyInfo: KeyInfo,
      content: Content,
      tags: Tags,
      version,
      documentAction: DocumentAction,
      attribActions: AttribActions,
      auditedById: AuditedBy,
      auditComment: AuditComment,
      isLatestCache,
      createdAt,
      auditedAt,
    };
  }

  protected toItem(rawItem: DocumentRawItemAttribs): DocumentItemAttribs {
    return WikiDocument.toItem(rawItem);
  }
}
