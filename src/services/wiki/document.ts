import { DateTime } from 'luxon';
import WikiDocumentError from '../../errors/wiki/document';
import { Collection } from '../../models/chain/Collection.model';
import { Nft } from '../../models/chain/Nft.model';
import { User, UserId } from '../../models/User.model';
import { SigmateWikiSchema } from '../../models/wiki';
import { WikiBlockId } from '../../models/wiki/WikiBlock.schema';
import {
  BlockStructureHistory,
  DocumentAttribActions,
  WikiDocumentId,
  WikiDocumentSchema,
  WikiDocumentType,
  WikiDocumentVersionId,
} from '../../models/wiki/WikiDocument.schema';
import { WikiDocumentRel } from '../../models/wiki/WikiDocumentRel.model';
import { WikiTag } from '../../models/wiki/WikiTag.model';
import { ActionArgs, ActionMethod } from '../../utils/action';
import Droplet from '../../utils/droplet';
import { dynamodb, DynamoQueryArgs } from '../dynamodb';
import WikiBlock from './block';
import WikiValidator from './validate';

export interface DocumentDTO {
  id: WikiDocumentId;
  version: WikiDocumentVersionId;
  type: WikiDocumentType;
  title: string;
  keyInfo: BlockStructureHistory[];
  content: BlockStructureHistory[];
  attribActions: DocumentAttribActions;
  isLatestCopy: boolean;
  updatedById: UserId;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export type GenerateDocumentDTO = Omit<
  DocumentDTO,
  'isLatestCopy' | 'createdAt' | 'updatedAt'
>;

type WikiDocumentOptions = {
  id?: string;
  rel?: WikiDocumentRel;
  dto?: DocumentDTO;
};

export default class WikiDocument {
  public static VERSION_ALL = 'all';
  public static VERSION_LATEST = 'latest';
  private static PK_REGEX = /Document#(?<id>\d+)/;
  private static SK_REGEX = /Document#v_(?<version>\d+)/;
  private static TABLE_VERSIONS = 'SigmateWiki';

  public id: WikiDocumentId;
  public rel?: WikiDocumentRel;
  public versions: Map<WikiDocumentVersionId, DocumentDTO>;
  public blocks: Map<WikiDocumentVersionId, Map<WikiBlockId, WikiBlock>>;

  public get collection() {
    return this.rel?.collection;
  }

  public get nft() {
    return this.rel?.nft;
  }

  public get tags() {
    return this.rel?.tags;
  }

  public get createdBy() {
    return this.rel?.createdBy;
  }

  private latestVersion?: WikiDocumentVersionId;
  get latest() {
    if (!this.latestVersion) return undefined;
    return this.versions.get(this.latestVersion);
  }

  constructor(options: WikiDocumentOptions) {
    const { id, rel, dto } = options;
    this.versions = new Map();
    this.blocks = new Map();
    if (id) {
      this.id = id;
    } else {
      if (rel) {
        this.id = rel.id;
        this.rel = rel;
      } else if (dto) {
        this.id = dto.id;
        this.setVersion(dto);
      } else {
        throw new Error('WikiDocument: Invalid options');
      }
    }
  }

  @ActionMethod('WIKI/DOC/LOAD_MODEL')
  public async loadRelation(args: ActionArgs) {
    const { transaction } = args;
    if (this.rel) return this.rel;
    const rel = await WikiDocumentRel.findByPk(this.id, {
      include: [
        { model: Collection },
        { model: Nft },
        {
          model: WikiTag,
          through: { attributes: [] },
          attributes: ['id', 'name'],
        },
        { model: User, as: 'createdBy' },
      ],
      rejectOnEmpty: true,
      transaction,
    });
    this.rel = rel;
    return rel;
  }

  @ActionMethod({
    name: 'WIKI/DOC/LOAD_ALL',
    type: 'AWS',
  })
  public async getAllVersions(args: { force?: boolean } & ActionArgs = {}) {
    const { force, action } = args;
    if (force || this.versions.size === 0) {
      const { items } = await dynamodb.query(this.generateAllVersionsQuery());
      const documents: DocumentDTO[] = [];
      items.forEach((i) => {
        const item = WikiDocument.checkItem(i);
        const document = WikiDocument.toDTO(item);
        this.setVersion(document);
        documents.push(document);

        // Log loaded document versions for analytics
        action?.addTarget({
          model: 'WikiDocument',
          id: document.id,
          version: document.version,
          type: 'dynamo',
        });
      });
      return documents;
    } else {
      return Array.from(this.versions.values());
    }
  }

  @ActionMethod({
    name: 'WIKI/DOC/LOAD_ONE',
    type: 'AWS',
  })
  public async getVersion(
    options: { version: WikiDocumentVersionId; force?: boolean } & ActionArgs
  ) {
    const { version, force, action } = options;

    let document: DocumentDTO | undefined;
    if (version === WikiDocument.VERSION_ALL) {
      throw new Error(
        'This method only loads a single version. Use loadAll() instead'
      );
    } else if (version === WikiDocument.VERSION_LATEST) {
      // Fetch latest version
      document = this.latest;
    } else {
      // Fetch a specified version
      document = this.versions.get(version);
    }

    // Need to fetch from DB
    if (!document || force) {
      const { item } = await dynamodb.getItem({
        tableName: WikiDocument.TABLE_VERSIONS,
        key: this.generateKey(version),
      });
      const documentItem = WikiDocument.checkItem(item);
      document = WikiDocument.toDTO(documentItem);
      this.setVersion(document);
    }

    // Log loaded document for analytics
    action?.addTarget({
      model: 'WikiDocument',
      id: document.id,
      version: document.version,
      type: 'dynamo',
    });

    return document;
  }

  public setVersion(dto: DocumentDTO) {
    const { id, version, isLatestCopy } = dto;
    if (this.id !== id) {
      throw new WikiDocumentError('WIKI/DOC/ER_ID');
    }
    this.versions.set(version, dto);
    const latest = this.latest;
    if (isLatestCopy) {
      if (latest) {
        if (latest.version !== version) {
          latest.isLatestCopy = false;
          this.latestVersion = version;
        }
      } else {
        this.latestVersion = version;
      }
    } else {
      // If this version was created after the currently loaded "latest" version,
      // that version is obviously not "latest" anymore
      if (latest) {
        const latestCreatedAt = Droplet.getDateTime(latest.version);
        const versionCreatedAt = Droplet.getDateTime(dto.version);
        if (versionCreatedAt > latestCreatedAt) {
          latest.isLatestCopy = false;
          this.latestVersion = undefined;
        }
      }
    }
  }

  private generateKey(version: WikiDocumentVersionId) {
    return WikiDocument.generateKey(this.id, version);
  }

  private generateLatestKey() {
    return WikiDocument.generateLatestKey(this.id);
  }

  private generateAllVersionsQuery() {
    return WikiDocument.generateAllVersionsQuery(this.id);
  }

  private static getPK(id: WikiDocumentId) {
    return `Document#${id}`;
  }

  private static getSK(version: WikiDocumentVersionId) {
    return `Document#v_${version}`;
  }

  private static getAllVersionsSK() {
    return this.getSK('');
  }

  private static getLatestSK() {
    return this.getSK(WikiDocument.VERSION_LATEST);
  }

  private static generateKey(
    id: WikiDocumentId,
    version: WikiDocumentVersionId
  ): SigmateWikiSchema {
    return {
      WikiPK: this.getPK(id),
      WikiSK: this.getSK(version),
    };
  }

  private static generateLatestKey(id: WikiDocumentId): SigmateWikiSchema {
    return {
      WikiPK: this.getPK(id),
      WikiSK: this.getLatestSK(),
    };
  }

  private static generateAllVersionsQuery(id: WikiDocumentId): DynamoQueryArgs {
    return {
      tableName: WikiDocument.TABLE_VERSIONS,
      keyConditionExpression:
        'WikiPK = :pkval AND begins_with (WikiSK, :skval)',
      expressionAttributeValues: {
        pkVal: this.getPK(id),
        skVal: this.getAllVersionsSK(),
      },
      ascending: false,
    };
  }

  private static checkItem(
    item: Record<string, unknown> | undefined
  ): WikiDocumentSchema {
    if (!item) throw new WikiDocumentError('WIKI/DOC/NF_VERSION');
    const {
      WikiPK,
      WikiSK,
      Type,
      Title,
      KeyInfo,
      Content,
      DocVersion,
      AttribActions,
      UpdatedById,
    } = item;

    if (!WikiPK || typeof WikiPK !== 'string') {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/IV_PK',
        message: `WikiPK: ${WikiPK}`,
      });
    }
    if (!WikiSK || typeof WikiSK !== 'string') {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/IV_SK',
        message: `WikiSK: ${WikiSK}`,
      });
    }
    if (!Type || typeof Type !== 'string') {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/IV_TYPE',
        message: `Type: ${Type}`,
      });
    }
    if (!Title || typeof Title !== 'string') {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/ER_ITEM',
        message: `Title: ${Title}, (${typeof Title})`,
      });
    }

    if (KeyInfo) {
      if (KeyInfo instanceof Array) {
        try {
          KeyInfo.forEach((i) => {
            WikiValidator.validateBlockStructureHistory(i);
          });
        } catch (error) {
          let message = 'Invalid KeyInfo';
          if (error instanceof Error) {
            message += `: ${error.message}`;
          }
          throw new WikiDocumentError({ code: 'WIKI/DOC/ER_ITEM', message });
        }
      } else {
        throw new WikiDocumentError({
          code: 'WIKI/DOC/ER_ITEM',
          message: 'Invalid KeyInfo: Not an array',
        });
      }
    }

    if (Content) {
      if (Content instanceof Array) {
        try {
          Content.forEach((i) => {
            WikiValidator.validateBlockStructureHistory(i);
          });
        } catch (error) {
          let message = 'Invalid Content';
          if (error instanceof Error) {
            message += `: ${error.message}`;
          }
          throw new WikiDocumentError({ code: 'WIKI/DOC/ER_ITEM', message });
        }
      } else {
        throw new WikiDocumentError({
          code: 'WIKI/DOC/ER_ITEM',
          message: 'Invalid Content: Not an array',
        });
      }
    }

    if (!DocVersion || typeof DocVersion !== 'string') {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/ER_ITEM',
        message: 'Invalid DocVersion',
      });
    }

    if (AttribActions && typeof AttribActions === 'object') {
      const { Type, Title, KeyInfo, Content } = AttribActions as Record<
        string,
        unknown
      >;
      if (
        Type !== null &&
        typeof Type === 'string' &&
        !WikiValidator.STRUCT_ACTIONS.has(Type)
      ) {
        throw new WikiDocumentError({
          code: 'WIKI/DOC/ER_ITEM',
          message: 'Invalid AttribActions.Type',
        });
      }
      if (Title !== null && typeof Title === 'string') {
        throw new WikiDocumentError({
          code: 'WIKI/DOC/ER_ITEM',
          message: 'Invalid AttribActions.Title',
        });
      }
      if (KeyInfo !== null && typeof KeyInfo === 'string') {
        throw new WikiDocumentError({
          code: 'WIKI/DOC/ER_ITEM',
          message: 'Invalid AttribActions.KeyInfo',
        });
      }
      if (Content !== null && typeof Content === 'string') {
        throw new WikiDocumentError({
          code: 'WIKI/DOC/ER_ITEM',
          message: 'Invalid AttribActions.Content',
        });
      }
    } else {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/ER_ITEM',
        message: 'Invalid AttribActions',
      });
    }

    if (!UpdatedById || typeof UpdatedById !== 'string') {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/ER_ITEM',
        message: 'Invalid UpdatedById',
      });
    }

    return {
      WikiPK,
      WikiSK,
      Type: Type as WikiDocumentType,
      Title,
      KeyInfo: KeyInfo as BlockStructureHistory[],
      Content: Content as BlockStructureHistory[],
      DocVersion,
      AttribActions: AttribActions as WikiDocumentSchema['AttribActions'],
      UpdatedById,
    };
  }

  private static toDTO(item: WikiDocumentSchema): DocumentDTO {
    const {
      WikiPK,
      WikiSK,
      Type: type,
      Title: title,
      KeyInfo: keyInfo,
      Content: content,
      DocVersion,
      AttribActions: attribActions,
      UpdatedById: updatedById,
    } = item;

    const pkMatch = WikiDocument.PK_REGEX.exec(WikiPK);
    let id: DocumentDTO['id'] | undefined = undefined;
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
    let version: DocumentDTO['version'] | undefined = undefined;
    let isLatestCopy = false;
    if (skMatch) {
      version = skMatch.groups?.version;
      if (version === WikiDocument.VERSION_LATEST) {
        isLatestCopy = true;
        version = DocVersion;
      }
    }
    if (!skMatch || version === undefined) {
      throw new WikiDocumentError({
        code: 'WIKI/DOC/IV_SK',
        message: `SK: ${WikiSK}`,
      });
    }

    const createdAt = Droplet.getDateTime(id);
    const updatedAt = Droplet.getDateTime(version);

    return {
      id,
      version,
      type,
      title,
      keyInfo,
      content,
      attribActions,
      isLatestCopy,
      updatedById,
      createdAt,
      updatedAt,
    };
  }

  private static toItem(
    dto: DocumentDTO,
    isLatestCopy = false
  ): WikiDocumentSchema {
    const {
      id,
      version,
      type: Type,
      title: Title,
      keyInfo: KeyInfo,
      content: Content,
      attribActions: AttribActions,
      updatedById: UpdatedById,
    } = dto;

    return {
      WikiPK: this.getPK(id),
      WikiSK: this.getSK(isLatestCopy ? version : WikiDocument.VERSION_LATEST),
      Type,
      Title,
      KeyInfo,
      Content,
      DocVersion: version,
      AttribActions,
      UpdatedById,
    };
  }
}
