import { DateTime } from 'luxon';
import { MintingEventAttribs } from '../models/calendar/MintingEvent.model';
import { CollectionAttribs } from '../models/chain/Collection.model';
import { CollectionMarketplaceAttribs } from '../models/chain/CollectionMarketplace.model';
import { MarketplaceAttribs } from '../models/chain/Marketplace.model';
import { NftAttribs } from '../models/chain/Nft.model';
import { NftCategoryAttribs } from '../models/chain/NftCategory.model';
import { User, UserId } from '../models/User.model';

declare global {
  namespace sigmate.Wiki {
    type DropletId = globalThis.sigmate.DropletId;

    // ============================
    //  DIFF
    // ============================

    type DiffAction = 'C' | 'U' | 'D' | '-';
    type DiffTranspose = 'T' | '-';

    /**
     * Result of diff algorithms
     */
    type DiffResult = {
      /**
       * * `C`: Created
       * * `U`: Updated
       * * `D`: Deleted
       * * `-`: No changes
       */
      action: DiffAction;
      /**
       * For data that is part of the array, whether the data has been
       * transposed within the array
       * * `T`: Transposed
       * * `-`: No changes
       */
      transposed?: DiffTranspose;
    };

    /**
     * Concise form of `DiffResult` to store in DynamoDB
     * * `C-`: Created
     * * `U-`: Updated
     * * `UT`: Updated **and** Transposed
     * * `-T`: Transposed
     * * `D-`: Deleted
     * * `--: No changes
     */
    type DiffResultRaw = 'C-' | 'U-' | 'UT' | '-T' | 'D-' | '--';

    type DocumentDiffRaw = Partial<{
      Type: DiffAction;
      Title: DiffAction;
      KeyInfo: DiffResultRaw;
      Content: DiffResultRaw;
      Tags: Record<string, DiffAction>;
    }>;

    type DocumentDiff = Partial<{
      type: DiffAction;
      title: DiffAction;
      keyInfo: DiffResult;
      content: DiffResult;
      tags: Record<string, DiffAction>;
    }>;

    type BlockDiffRaw = Partial<{
      Type: DiffAction;
      Data: DiffAction;
      Ext: Record<string, DiffAction>;
      KeyInfo: DiffAction;
    }>;

    type BlockDiff = Partial<{
      type: DiffAction;
      data: DiffAction;
      external: Record<string, DiffAction>;
      keyInfo: DiffAction;
    }>;

    type StructureDiffRaw = {
      Id: string;
      Diff: DiffResultRaw;
    };

    type StructureDiff = {
      id: string;
      diff: DiffResult;
    };

    // ============================
    //  DOCUMENT BASES
    // ============================

    type DocumentId = DropletId;
    type DocumentVersionId = DropletId;
    type DocumentType = 'collection#' | 'nft#' | 'team#' | 'person#' | 'term#';

    // ============================
    //  BLOCK BASES
    // ============================

    type BlockId = DropletId;
    type BlockVersionId = DropletId;
    type BlockType =
      | 'header'
      | 'paragraph'
      | 'list'
      | 'table'
      | 'image'
      | 'warning'
      | 'keyinfo';

    // ============================
    //  BLOCK EXTERNAL DATA
    // ============================

    type ExtDataName =
      | 'ExtClId'
      | 'ExtClName'
      | 'ExtClDiscord'
      | 'ExtClTwitter'
      | 'ExtClTelegram'
      | 'ExtClWebsite'
      | 'ExtClFloorPrice'
      | 'ExtClMintingPrices'
      | 'ExtClChains'
      | 'ExtClMarketplaces'
      | 'ExtClCategory'
      | 'ExtNftId';

    type ExtCache = string | number | Record<string, unknown> | Array<unknown>;

    type Ext<
      CT extends ExtCache = ExtCache,
      DT extends DateTime | string = DateTime
    > = {
      /** Cached external data. */
      cache: CT | null;
      /** When the data was last "fetched" from its source. */
      cachedAt: DT;
      /** When the data "source" was last updated. May not change on every refresh */
      updatedAt?: DT;
    };

    type ExtRaw<CT extends ExtCache = ExtCache> = Ext<CT, string>;

    type DocumentExt = Partial<{
      ExtClId: Ext<CollectionAttribs['id']> | null;
      ExtNftId: Ext<NftAttribs['id']> | null;
      ExtClName: Ext<string> | null;
      ExtClDiscord: Ext<string> | null;
      ExtClTwitter: Ext<string> | null;
      ExtClTelegram: Ext<string> | null;
      ExtClWebsite: Ext<string> | null;
      ExtClChains: Ext<ExtChain[]> | null;
      ExtClMarketplaces: Ext<ExtMarketplace[]> | null;
      ExtClCategory: Ext<ExtCategory> | null;
      ExtClFloorPrice: Ext<ExtFloorPrice> | null;
      ExtClMintingPrices: Ext<ExtClMintingPrice[]> | null;
    }>;

    type ExtFloorPrice = {
      floorPrice: NonNullable<CollectionAttribs['floorPrice']>;
      floorPriceCurrency: ExtChain;
    };

    type ExtClMintingPrice<DT extends DateTime | string = DateTime> = {
      id: MintingEventAttribs['id'];
      name: MintingEventAttribs['name'];
      price: MintingEventAttribs['price'];
      priceUpdatedAt: DT;
      startsAt: DT;
      startsAtPrecision: MintingEventAttribs['startsAtPrecision'];
    };

    type ExtChain = {
      symbol: string;
    };

    type ExtMarketplace = {
      id: MarketplaceAttribs['id'];
      name: MarketplaceAttribs['name'];
      url: MarketplaceAttribs['url'];
      collectionUrl?: CollectionMarketplaceAttribs['collectionUrl'];
      logoImage?: string;
    };

    type ExtCategory = {
      id: NftCategoryAttribs['id'];
      name: NftCategoryAttribs['name'];
    };

    // ============================
    //  BLOCK KEY INFO
    // ============================

    /** Possible values for Block Key info name */
    type KIName =
      | 'KIClTeam'
      | 'KIClHistory'
      | 'KIClDiscord'
      | 'KIClTwitter'
      | 'KIClCategory'
      | 'KIClMintingPrices'
      | 'KIClFloorprice'
      | 'KIClMarketplaces';

    /** Details of a key info block */
    type BlockKI = {
      /** Unique key to identify the type of key info in the backend app code. (Alphanumeric, no spaces) */
      name: string;
      /** Key info name to display to the user. If undefined, the default value is used */
      label?: string;
    };

    // ==================================
    //  BLOCK: EDITORJS PLUGINS
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

    type NestedListItem = {
      content: string;
      items: NestedListItem[];
    };

    type NestedListBlockData = {
      style: string;
      items: NestedListItem[];
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

    type TagAttribs = {
      name: string;
    };

    // ==================================
    //  DYNAMO: TABLES
    // ==================================
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

      /** DynamoDB TTL attribute (UNIX epoch in seconds) */
      ExpiresAt?: number;
    }

    // ==================================
    //  DYNAMO: SCHEMAS
    // ==================================
    interface DocumentRawAttribs extends WikiAttribs {
      /** `Document::{DOCUMENT_ID} */
      WikiPK: WikiAttribs['WikiPK'];
      /**
       * `Document::v_{DOCUMENT_VERSION}`
       * * `DOCUMENT_VERSION`: Document version ID. `latest` for latest version
       */
      WikiSK: WikiAttribs['WikiSK'];
      Type: DocumentType;
      Title: string;
      KeyInfo: StructureDiffRaw[];
      Content: StructureDiffRaw[];
      Tags: Set<string>;

      // Cache of external data associcated to the document
      // Set on latest version cache ONLY
      ExtClId?: ExtRaw<CollectionAttribs['id']> | null;
      ExtNftId?: ExtRaw<NftAttribs['id']> | null;
      ExtClName?: ExtRaw<string> | null;
      ExtClDiscord?: ExtRaw<string> | null;
      ExtClTwitter?: ExtRaw<string> | null;
      ExtClTelegram?: ExtRaw<string> | null;
      ExtClWebsite?: ExtRaw<string> | null;
      ExtClChains?: ExtRaw<ExtChain[]> | null;
      ExtClMarketplaces?: ExtRaw<ExtMarketplace[]> | null;
      ExtClCategory?: ExtRaw<ExtCategory> | null;
      ExtClFloorPrice?: ExtRaw<ExtFloorPrice> | null;
      ExtClMintingPrices?: ExtRaw<ExtClMintingPrice<string>[]> | null;

      /**
       * Version of the document.
       * Only kept on latest version since the sort key does not
       * contain the document version
       */
      Version?: DocumentVersionId;
      /** Flag for the latest version */
      IsLatest: boolean;
      /**
       * Start of the range of
       * document version to query to initially build a document
       */
      BuildVersionStart: DocumentVersionId;
      /**
       * End of the range of
       * document version to query to initially build a document
       */
      BuildVersionEnd: DocumentVersionId;
      /** Overall diff of this version */
      Action: DiffAction;
      /** Audits made to each attribute */
      Diff: DocumentDiffRaw;
      AuditedBy: UserId;
      /** Comment from the user who created this version */
      AuditComment?: string;
      Schema: 1;
    }

    interface BlockRawAttribs extends WikiAttribs {
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
       *   * `DOC_VERSION`: **Document** version ID. Use `latest` for copy of latest version. **NOT** block ID.
       *   * `ID`: Block ID
       */
      WikiSK: WikiAttribs['WikiSK'];

      /**
       * `BlockHistory::{DOCUMENT_ID}`
       * * `ID`: Document ID
       *
       * *Optional:* Not set on block caches generated during document build
       */
      WikiGSIPK?: WikiAttribs['WikiGSIPK'];

      /**
       * `Block::{ID}::v_{VERSION}`
       * * Usage
       *   * Query all versions of a certain block
       * * Values
       *   * `ID`: Block ID
       *   * `VERSION`: Block Version ID. Use `latest` for copy of latest version
       *
       * *Optional:* Not set on block caches generated during document build
       */
      WikiGSISK?: WikiAttribs['WikiGSISK'];

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
       * *(Optional. Key info blocks only)* Contains details of document key info.
       * Used by backend to build response data.
       * Used by frontend to determine how to render the block
       */
      KeyInfo?: BlockKI;

      Ext?: Set<ExtDataName>;

      /**
       * Block version ID. Incremented on every audit.
       */
      Version?: BlockVersionId;

      /** Whether this is the latest version */
      IsLatest: boolean;

      /** Overall diff of this version
       * * `C`: Block creation. First version
       * * `U`: Block update.
       * * `D`: Block deletion. Last version
       * * `-`: No change. Block cache generated during document version build
       */
      Action: DiffAction;

      /**
       * Audit action on each block attribute
       */
      Diff: BlockDiffRaw;

      /**
       * *(Optional)* Document version ID of when this block version was created.
       * (i.e. when the block was either created/updated/deleted)
       * On block caches, this value must be used instead of the one in the sort key.
       *
       * Only present on block caches (generated on document builds)
       */
      DocumentVersion?: DocumentVersionId;

      /**
       * `VerificationCountPositiveVerify`: Number of "VERIFY" verifications on this block
       * Only updated on the latest cache until block is updated, on which it is copied
       */
      VfCntPosVr: number;

      /**
       * `VerificationCountNegativeBeAware`: Number of "BE AWARE" verifications on this block
       * Only updated on the latest cache until block is updated, on which it is copied
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

      /*
        Original
        * SK: document version is correct (USE THIS)
        * GSI_SK: block version is correct (USE THIS)
        * Version: undefined
        * DocumentVersion: undefined

        Cached(latest)
        * SK: document version is VERSION_LATEST
        * GSI_SK: block version is VERSION_LATEST
        * Version: explicitly set (USE THIS)
        * DocumentVersion: explicitly set (USE THIS)
        
        Cached(document build)
        * SK: document version is the cached version
        * GSI_SK: not set
        * Version: explicitly set (USE THIS)
        * DocumentVersion: explicitly set (USE THIS)
      */
    }

    // ==================================
    //  DTO
    //  DTOs are intermediary data structures within the application code
    //  Request --> DTO --> RAW --> DB --> RAW --> DTO --> Response
    // ==================================

    interface DocumentAttribs {
      // Data
      id: DocumentId;
      type: DocumentType;
      title: string;
      keyInfo: StructureDiff[];
      content: StructureDiff[];
      tags: Set<string>;
      external?: DocumentExt;

      // Version & Diff
      version: DocumentVersionId;
      isLatest: boolean;
      action: DiffAction;
      diff: DocumentDiff;
      auditedById: UserId;
      auditComment?: string;

      // SQL (added during build)
      auditedBy?: User;

      // Backend only
      buildVersionRange: [DocumentVersionId, DocumentVersionId];
      schema: 1;
    }

    interface BlockAttribs {
      // Data
      id: BlockId;
      type: BlockType;
      data: AnyBlockData | null;
      keyInfo?: BlockKI;
      external?: Set<ExtDataName>;
      verificationCount: {
        verify: number;
        beAware: number;
      };

      // Version & Diff
      version: BlockVersionId;
      isLatest: boolean;
      action: DiffAction;
      diff: BlockDiff;
      auditedById: UserId;
      document: {
        id: DocumentId;
        version: DocumentVersionId;
      };

      // Assigned during build
      transposed?: DiffTranspose;
      auditedBy?: User;

      // Backend only
      cache?: {
        documentVersion: DocumentVersionId;
        expiresAt: DateTime;
      };
      buildAt?: DateTime;
      schema: 1;
    }

    // ==================================
    //  REQ & RES
    // ==================================

    type Optional = globalThis.sigmate.Optional;
    type UserResponse = globalThis.sigmate.Api.User.UserResponse;

    interface DocumentCRequest
      extends Pick<DocumentAttribs, 'type' | 'title' | 'auditComment'> {
      keyInfo: BlockCRequest[];
      content: BlockCRequest[];
      tags: string[];
      /**
       * Generated by backend. User-sent values are ignored
       */
      external?: Set<ExtDataName>;
      collection?: {
        id: CollectionAttribs['id'];
      };
      nft?: {
        id: NftAttribs['id'];
      };
    }

    interface DocumentURequest
      extends Omit<DocumentCRequest, 'collection' | 'nft'> {
      id: DocumentAttribs['id'];
    }

    interface DocumentResponse
      extends Omit<
        | DocumentAttribs
        | 'keyInfo'
        | 'content'
        | 'collectionId'
        | 'nftId'
        | 'buildVersionRange'
        | 'auditedBy'
      > {
      keyInfo: BlockResponse[];
      content: BlockResponse[];
      auditedBy?: UserResponse;
      createdAt: string; // Derived from ID (Droplet)
      auditedAt: string; // Derived from version ID (Droplet)
    }

    interface BlockURequest
      extends Pick<
        BlockAttribs,
        'id' | 'type' | 'data' | 'keyInfo' | 'schema'
      > {
      external: string[];
      document: Pick<BlockAttribs['document'], 'id'>;
    }

    type BlockCRequest = BlockURequest;

    interface BlockResponse extends BlockAttribs {
      auditedBy?: UserResponse;
      createdAt: string; // ISO timestamp. Derived from ID (Droplet)
      auditedAt: string; // ISO timestamp. Derived from version ID (Droplet)
    }
  }
}
