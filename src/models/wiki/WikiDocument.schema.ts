import { DropletId } from '../../utils/droplet';
import { UserId } from '../User.model';
import {
  AuditAction,
  WikiBlockId,
  WikiBlockVersionId,
} from './WikiBlock.schema';
import { SigmateWikiPK, SigmateWikiSchema, SigmateWikiSK } from '.';

export type WikiDocumentId = DropletId;
export type WikiDocumentVersionId = DropletId;

export type WikiDocumentType =
  | 'type#collection'
  | 'type#nft'
  | 'type#team'
  | 'type#perosn'
  | 'type#term';

/**
 * Latest version of a Wiki document
 */
export interface WikiDocumentSchema extends SigmateWikiSchema {
  /** `Document#{DOCUMENT_ID} */
  WikiPK: SigmateWikiPK;
  /**
   * `Document#v_{DOCUMENT_VERSION}`
   * * `DOCUMENT_VERSION`: `latest` for latest version
   */
  WikiSK: SigmateWikiSK;
  Type: WikiDocumentType;
  Title: string;
  KeyInfo: BlockStructureHistory[];
  Content: BlockStructureHistory[];
  DocVersion: WikiDocumentVersionId;
  AttribActions: DocumentAttribActions;
  /** User who edited this version of the document */
  UpdatedById: UserId;
}

export type DocumentAttribActions = {
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

export type BlockStructureHistory = {
  id: WikiBlockId;
  version: WikiBlockVersionId;
  action: StructureAuditAction | null;
  children?: BlockStructureHistory[];
};

export type ObjectHistory<DT, AT = AuditAction> = {
  /** Left `null` on `delete` and `move` actions */
  data: DT;
  /** Left `null` on no change */
  action: AT | null;
};

export type StructureAuditAction = AuditAction | 'move';
