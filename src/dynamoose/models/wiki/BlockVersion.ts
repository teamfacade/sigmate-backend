import { model } from 'dynamoose';
import { Item } from 'dynamoose/dist/Item';
import BlockVersionSchema from '../../schemas/wiki/block.schema';

type BlockAttribs = sigmate.Wiki.BlockRawItemAttribs;

export class BlockVersionItem extends Item {
  /**
   * `Document::{ID}`
   * * `ID`: Document ID
   */
  WikiPK!: BlockAttribs['WikiPK'];

  /**
   * `Block::v_{DOC_VERSION}::{ID}`
   * * Usage
   *   * Query latest version of all blocks of a certain document
   *   * Query all blocks needed to a certain version of a document
   * * Values
   *   * `DOC_VERSION`: **Document** version ID. **NOT** block ID. Use `latest` for copy of latest version
   *   * `ID`: Block ID
   */
  WikiSK!: BlockAttribs['WikiSK'];

  /**
   * `BlockHistory::{DOCUMENT_ID}`
   * * `ID`: Document ID
   */
  WikiGSIPK: BlockAttribs['WikiGSIPK'];

  /**
   * `Block::{ID}::v_{VERSION}`
   * * Usage
   *   * Query all versions of a certain block
   * * Values
   *   * `ID`: Block ID
   *   * `VERSION`: Block Version ID. Use `latest` for copy of latest version
   */
  WikiGSISK: BlockAttribs['WikiGSISK'];

  /**
   * *(Optional)* Block version ID.
   * Incremented on every audit.
   * Only exists on latest version copies, where the sort key does not contain the block version ID
   */
  BlockVersion!: BlockAttribs['BlockVersion'];

  /**
   * Document version ID of when this block version was created.
   * (i.e. when the block was either created/updated/deleted)
   *
   * On block caches (generated on document builds), this value may be
   * different from the value found on the sort key
   */
  DocumentVersion!: BlockAttribs['DocumentVersion'];

  /**
   * (EditorJS) Block type
   */
  Type!: BlockAttribs['Type'];

  /**
   * (EditorJS) Block contents.
   * Left `null` for some KeyInfo blocks
   */
  Data!: BlockAttribs['Data'];

  /**
   * *(Optional)* External data. Stores cache of the data that is fetched from an external source
   * (another DB, third party APIs, etc.)
   */
  Ext?: BlockAttribs['Ext'];

  /**
   * *(Optional. Key info blocks only)* Contains details of document key info.
   * Used by backend to build response data.
   * Used by frontend to determine how to render the block
   */
  KeyInfo?: BlockAttribs['KeyInfo'];

  /**
   * Overall audit action on the block
   * * `create`: First block version
   * * `delete`: Last block version
   * * `update`: All other versions
   * * `null`: No changes were made. "Cached" block data generated during document builds may have this value
   */
  BlockAction!: BlockAttribs['BlockAction'];

  /**
   * Audit action on each block attribute
   */
  AttribActions!: BlockAttribs['AttribActions'];

  /**
   * `VerificationCountPositiveVerify`: Number of "VERIFY" verifications on this block
   */
  VfCntPosVr!: BlockAttribs['VfCntPosVr'];

  /**
   * `VerificationCountNegativeBeAware`: Number of "BE AWARE" verifications on this block
   */
  VfCntNegBA!: BlockAttribs['VfCntNegBA'];

  /**
   * User who created this block version
   */
  AuditedBy!: BlockAttribs['AuditedBy'];

  /**
   * Version of the schema
   */
  Schema!: BlockAttribs['Schema'];
}

const BlockVersion = model<BlockVersionItem>(
  'BlockVersion',
  BlockVersionSchema,
  { initialize: false }
);

export default BlockVersion;
