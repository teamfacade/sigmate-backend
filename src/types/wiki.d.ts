import { DateTime } from 'luxon';
import { User, UserId } from '../models/User.model';

declare global {
  namespace sigmate.Wiki {
    // BASICS
    type DropletId = globalThis.sigmate.DropletId;

    type AuditAction = 'create' | 'update' | 'delete';
    type StructureAuditAction = AuditAction | 'move';

    type DocumentId = DropletId;
    type DocumentVersionId = DropletId;
    type DocumentType = 'collection#' | 'nft#' | 'team#' | 'person#' | 'term#';

    type DocumentAttribActions = {
      Type: AuditAction | null;
      Title: AuditAction | null;
      /**
       * Overall change applied to the block structure
       * * `create`: First version (on document creation)
       * * `update`: *At least* one block was created, updated *or* deleted
       * * `delete`: Last version (on document deletion)
       * * `move`: *No* blocks were created, updated *or* deleted.
       *   At least one of the blocks were moved (repositioned) without any changes to its contents.
       *   If blocks are simply repositioned (i.e. moved) without any updates, a new block version is *not* created
       */
      KeyInfo: StructureAuditAction | null;
      /**
       * Overall change applied to the block structure
       * * `create`: First version (on document creation)
       * * `update`: *At least* one block was created, updated *or* deleted
       * * `delete`: Last version (on document deletion)
       * * `move`: *No* blocks were created, updated *or* deleted.
       *   At least one of the blocks were moved (repositioned) without any changes to its contents.
       *   If blocks are simply repositioned (i.e. moved) without any updates, a new block version is *not* created
       */
      Content: StructureAuditAction | null;
    };

    type BlockStructure = {
      id: BlockId;
      /** Version of the document where this block version was created */
      documentVersion: DocumentVersionId;
      action: StructureAuditAction | null;
    };

    type BlockId = DropletId;
    type BlockVersionId = DropletId;
    type BlockType =
      | 'header'
      | 'paragraph'
      | 'list'
      | 'table'
      | 'image'
      | 'warning';

    type BlockExtCache =
      | string
      | number
      | Record<string, unknown>
      | Array<unknown>
      | null;

    /** Details of external data attached to the block */
    type BlockExt = {
      /** Cached external data. */
      cache: BlockExtCache;
      /** ISO Timestamp when the data was last "fetched" from its source. */
      cachedAt: string | null; // Timestamp
      /**
       * ISO Timestamp when the data "source" was last updated (shown to the user).
       * May not change on every other fetch.
       * Defaults to `fetchedAt` when not provided on fetch.
       */
      updatedAt?: string; // Timestamp
    };

    type BlockExtDTO<T extends BlockExtCache = BlockExtCache> = {
      cache: T | null;
      cachedAt: DateTime | null;
      updatedAt?: DateTime;
    };

    type ExtFloorPrice = {
      floorPrice: number;
      floorPriceCurrency: ExtChain;
    };

    type ExtClMintingPrice = {
      name: string;
      price: number;
      priceUpdatedAt: DateTime;
    };

    type ExtChain = {
      symbol: string;
    };

    type ExtMarketplace = {
      name: string;
      url: string;
      collectionUrl?: string;
      logoImage?: string;
    };

    type ExtCategory = {
      id: string;
      name: string;
    };

    /** Details of a key info block */
    type BlockKI = {
      /** Unique key to identify the type of key info in the backend app code. (Alphanumeric, no spaces) */
      name: string;
      /** Key info name to display to the user. If undefined, the default value is used */
      label?: string;
    };

    type BlockAttribActions = {
      type: AuditAction | null;
      data: AuditAction | null;
      ext?: Record<string, AuditAction | null>;
      keyInfo?: {
        label: AuditAction | null;
      } | null;
    };

    // ==================================
    //  EditorJS block plugin data types
    // ==================================

    type HeaderBlockData = {
      text: string;
      level: number;
    };

    type ParagraphBlockData = {
      text: string;
    };

    type ListBlockData = {
      style: string;
      items: string[];
    };

    type NestedListBlockItem = {
      content: string;
      items: NestedListBlockItem[];
    };

    type NestedListBlockData = {
      style: string;
      items: NestedListBlockItem[];
    };

    type TableBlockData = {
      withHeadings: boolean;
      content: string[][];
    };

    type ImageBlockData = {
      file: {
        url: string;
        // Any additional property returned from backend uploader
        [key: string]: unknown;
      };
      caption: string;
      withBorder: boolean;
      withBackground: boolean;
      stretched: boolean;
    };

    type WarningBlockData = {
      title: string;
      message: string;
    };

    type AnyBlockData =
      | HeaderBlockData
      | ParagraphBlockData
      | ListBlockData
      | NestedListBlockData
      | ImageBlockData
      | TableBlockData
      | WarningBlockData;

    // TABLES
    /** Key attributes of SigmateWiki table */
    interface WikiAttribs {
      /** Partition Key (hash key) */
      WikiPK: string;
      /** Sort key (range key) */
      WikiSK: string;

      /** GSI Partition Key (hash key) */
      WikiGSIPK?: string;
      /** GSI Sort key (range key) */
      WikiGSISK?: string;
    }

    // SCHEMAS

    interface DocumentRawItemAttribs extends WikiAttribs {
      /** `Document::{DOCUMENT_ID} */
      WikiPK: WikiAttribs['WikiPK'];
      /**
       * `Document::v_{DOCUMENT_VERSION}`
       * * `DOCUMENT_VERSION`: Document version ID. `latest` for latest version
       */
      WikiSK: WikiAttribs['WikiSK'];
      Type: DocumentType;
      Title: string;
      KeyInfo: BlockStructure[];
      Content: BlockStructure[];
      Tags: string[];

      /**
       * Version of the document.
       * Only kept on latest version copies since the sort key does not
       * contain the document version
       */
      DocumentVersion?: DocumentVersionId;
      /** Overall audit action on this version */
      DocumentAction: AuditAction | null;
      /** Audits made to each attribute */
      AttribActions: DocumentAttribActions;
      AuditedBy: UserId;
      /** Comment from the user who created this version */
      AuditComment?: string;
    }

    interface DocumentItemAttribs {
      id: DocumentId;
      type: DocumentType;
      title: string;
      keyInfo: BlockStructure[];
      content: BlockStructure[];
      tags: string[];
      version: DocumentVersionId;
      documentAction: AuditAction | null;
      attribActions: DocumentAttribActions;
      auditedById: UserId;
      auditComment?: string;
      isLatestCache: boolean;
      createdAt: DateTime;
      auditedAt: DateTime;
    }

    interface DocumentBuildAttribs
      extends Omit<
        DocumentItemAttribs,
        'keyInfo' | 'content' | 'tags' | 'auditedById' | 'isLatestCache'
      > {
      keyInfo: BlockBuildAttribs[];
      content: BlockBuildAttribs[];
      tags: { name: string }[];
      auditedBy: User;
    }

    interface BlockRawItemAttribs extends WikiAttribs {
      /**
       * `Document::{ID}`
       * * `ID`: Document ID
       */
      WikiPK: WikiAttribs['WikiPK'];

      /**
       * `Block::v_{DOC_VERSION}::{ID}`
       * * Usage
       *   * Query latest version of all blocks of a certain document
       *   * Query all blocks needed to a certain version of a document
       * * Values
       *   * `DOC_VERSION`: **Document** version ID. **NOT** block ID. Use `latest` for copy of latest version
       *   * `ID`: Block ID
       */
      WikiSK: WikiAttribs['WikiSK'];

      /**
       * `BlockHistory::{DOCUMENT_ID}`
       * * `ID`: Document ID
       */
      WikiGSIPK: WikiAttribs['WikiGSIPK'];

      /**
       * `Block::{ID}::v_{VERSION}`
       * * Usage
       *   * Query all versions of a certain block
       * * Values
       *   * `ID`: Block ID
       *   * `VERSION`: Block Version ID. Use `latest` for copy of latest version
       */
      WikiGSISK: WikiAttribs['WikiGSISK'];

      /**
       * *(Optional)* Block version ID.
       * Incremented on every audit.
       * Only exists on latest version copies, where the sort key does not contain the block version ID
       */
      BlockVersion: BlockVersionId;

      /**
       * Document version ID of when this block version was created.
       * (i.e. when the block was either created/updated/deleted)
       *
       * On block caches (generated on document builds), this value may be
       * different from the value found on the sort key
       */
      DocumentVersion: DocumentVersionId;

      /**
       * (EditorJS) Block type
       */
      Type: BlockType;

      /**
       * (EditorJS) Block contents.
       * Left `null` for some KeyInfo blocks
       */
      Data: AnyBlockData | null;

      /**
       * *(Optional)* External data. Stores cache of the data that is fetched from an external source
       * (another DB, third party APIs, etc.)
       */
      Ext?: Record<string, BlockExt>;

      /**
       * *(Optional. Key info blocks only)* Contains details of document key info.
       * Used by backend to build response data.
       * Used by frontend to determine how to render the block
       */
      KeyInfo?: BlockKI;

      /**
       * Overall audit action on the block
       * * `create`: First block version
       * * `delete`: Last block version
       * * `update`: All other versions
       * * `null`: No changes were made. "Cached" block data generated during document builds may have this value
       */
      BlockAction: AuditAction | null;

      /**
       * Audit action on each block attribute
       */
      AttribActions: BlockAttribActions;

      /**
       * `VerificationCountPositiveVerify`: Number of "VERIFY" verifications on this block
       */
      VfCntPosVr: number;

      /**
       * `VerificationCountNegativeBeAware`: Number of "BE AWARE" verifications on this block
       */
      VfCntNegBA: number;

      /**
       * User who created this block version
       */
      AuditedBy: UserId;

      /**
       * Version of the schema
       */
      Schema: 1;
    }

    interface BlockItemAttribs {
      id: BlockId; // Block ID
      type: BlockType;
      data: AnyBlockData | null;
      verificationCount: {
        verify: number;
        beAware: number;
      };
      keyInfo?: {
        name: string;
        label?: string;
      };
      external?: Record<string, BlockExtDTO>;
      /** User who created this version */
      auditedById: UserId;

      version: BlockVersionId;
      document: DocumentId; // Derived from PK
      documentVersion: DocumentVersionId;
      isLatestCache: boolean;
      isGSI: boolean;
      blockAction: AuditAction | null;
      attribActions: BlockAttribActions;

      /** Derived from Block ID droplet. Discarded when generating items. */
      createdAt: DateTime;
      /** Derived from Block version ID droplet. Discarded when generating items. */
      auditedAt: DateTime;
      schema: 1;
    }

    interface BlockBuildAttribs
      extends Omit<BlockItemAttribs, 'isLatestCache' | 'isGSI'> {
      structureAction: StructureAuditAction | null;
      auditedBy?: User;
    }
  }
}
