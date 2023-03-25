import { SigmateWikiSchema } from '.';
import { DropletId } from '../../utils/droplet';
import { UserId } from '../User.model';
import { ObjectHistory, WikiDocumentVersionId } from './WikiDocument.schema';

export type WikiBlockId = DropletId;
export type WikiBlockVersionId = DropletId;

export interface WikiBlockSchema extends SigmateWikiSchema {
  /** `Document#{DOCUMENT_ID} */
  WikiPK: string;

  /**
   * `Block#{ID}#v_{VERSION}`
   * * `ID`: Block ID
   * * `VERSION`: Block version Id
   *
   * **Strategy**
   * - Created for every block audit action
   * - Not updated or deleted
   *
   * **Indexing Actions**
   * - (ID) Query the past audit history of a certain block
   *
   * `Block#v_latest#{ID}`
   * * `ID`: Block ID
   *
   * **Strategy**
   * - Created once when a block is first created
   * - Updated to maintain the latest version of the data
   * - Deleted when a delete action occurs
   *
   * **Indexing Actions**
   * - (latest) Get current version of document
   * - (latest) Get blocks with external data
   * - (latest) Get key info blocks
   */
  WikiSK: string;

  /**
   * `DocVersion#{DOCUMENT_ID}`
   *
   * **Strategy**
   * - This index is only set on `create` and `update` operations
   *   (i.e. when a block version is incremented)
   */
  WikiGSIPK?: string;

  /**
   * `Block#dv_{DOC_VERSION}#{ID}`
   * * `DOC_VERSION`: **Document** version ID where this block version was created
   * * `ID`: Block ID
   *
   * **Strategy**
   * - This sort key is only set on `create` and `update` operations
   *   (i.e. when a block version is incremented)
   *
   * **Indexing Actions**
   * - Build a past version of a document (Get block versions by time range)
   *   - If a past version of the document is requested,
   *     - Build the document (load the entire range of document versions)
   *     - Create block "version" items with `action = null` to cache the build result
   *     - Set a `ttl` to the generated dummy versions
   *   - If the request version has already been built,
   *     - Increase the ttl
   *     - Just return the query result without re-building
   */
  WikiGSISK?: string;

  /** (EditorJS) Block type */
  Type: BlockType;
  /** (EditorJS) Block contents. Left `null` for some KeyInfo blocks */
  Data: AnyBlockData | null;
  /**
   * Details of external source of data included in the block
   */
  Ext?: Record<string, BlockItemExternalData>;
  /**
   * (Key info block only) properties of document key info
   */
  KeyInfo?: KeyInfoDetails;

  /**
   * `documentVersion`:
   * Document version ID of when this block was last deleted/updated/created.
   * Needed during document builds to determine document version ranges to fetch.
   *
   * **NOTE: May be different from the document version value in the `WikiGSISK` attribute**
   */
  DocVersion: WikiDocumentVersionId;

  /**
   * Block version ID. Incremented on every audit
   * Kept explicitly because the sort key of the latest copy does not contain the block version ID
   */
  BlockVersion: WikiBlockVersionId;
  /**
   * Action on a block level.
   * * `null`: No changes were made to the block. This entry is created when a document version is "cached".
   */
  BlockAction: BlockAuditAction | null;

  /**
   * Action that occured on each of the attributes
   */
  AttribActions: Partial<BlockAttribActions>;

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
  UpdatedBy: UserId;

  /**
   * User who first created the block. Only stored in the first and latest version
   */
  CreatedBy?: UserId;

  /**
   * Version of the schema
   */
  Schema: 1;
}

export type BlockAttribActions = {
  Type: BlockAuditAction | null;
  Data: BlockAuditAction | null;
  Ext?: Record<string, BlockAuditAction | null> | null;
  KeyInfo?: {
    label: BlockAuditAction | null;
  } | null;
};

type KeyInfoDetails = {
  /** Unique key to identify the type of key info in the backend app code. (Alphanumeric, no spaces) */
  name: string;
  /** Key info name to display to the user. If undefined, the default value is used */
  label?: string;
};

/**
 * `key`: Unique key to identify an external data source (such as SQL databases, 3rd party APIs)
 * in the backend app code. Used to determine when/where/how to fetch the data from an external source.
 * In the block's `data`, The substring `::key::` (replace `key` with actual key value) is replaced with the data value.
 * Keys consist of alphanumerical characters without spaces.
 */
export type BlockItemExternalData = {
  /** Cached external data. */
  cache: string | number | Record<string, unknown> | Array<unknown> | null;
  /** Timestamp when the data was last "fetched" from its source. */
  cachedAt: string | null; // Timestamp
  /**
   * Timestamp when the data "source" was last updated (shown to the user).
   * May not change on every other fetch.
   * Defaults to `fetchedAt` when not provided on fetch.
   */
  updatedAt?: string; // Timestamp
};

export type BlockExternalDataHistory = Record<
  string,
  ObjectHistory<BlockItemExternalData>
>;

// ==================================
//  EditorJS block plugin data types
// ==================================

export type HeaderBlockData = {
  text: string;
  level: number;
};

export type ParagraphBlockData = {
  text: string;
};

export type ListBlockData = {
  style: string;
  items: string[];
};

export type NestedListBlockItem = {
  content: string;
  items: NestedListBlockItem[];
};

export type NestedListBlockData = {
  style: string;
  items: NestedListBlockItem[];
};

export type TableBlockData = {
  withHeadings: boolean;
  content: string[][];
};

export type ImageBlockData = {
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

export type WarningBlockData = {
  title: string;
  message: string;
};

export type BlockAuditAction = 'create' | 'update' | 'delete';

export type BlockType =
  | 'header'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'image'
  | 'warning';

export type AnyBlockData =
  | HeaderBlockData
  | ParagraphBlockData
  | ListBlockData
  | NestedListBlockData
  | ImageBlockData
  | TableBlockData
  | WarningBlockData;
