import { DropletId } from '../../utils/droplet';
import { UserId } from '../User.model';
import {
  BlockAuditAction,
  WikiBlockId,
  WikiBlockVersionId,
} from './WikiBlock.schema';
import { SigmateWikiPK, SigmateWikiSchema, SigmateWikiSK } from '.';

export type WikiDocumentId = DropletId;
export type WikiDocumentVersionId = DropletId;

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

  Type: ObjectHistory<string>;
  Title: ObjectHistory<string>;
  KeyInfo: BlockStructure[];
  Content: BlockStructure[];
  UpdatedBy: UserId;
}

export type BlockStructure = {
  id: WikiBlockId;
  version: WikiBlockVersionId;
  action?: BlockAuditAction;
  children?: BlockStructure[];
};

export type ObjectHistory<DT, AT = BlockAuditAction> = {
  /** Left `null` on `delete` and `move` actions */
  data: DT;
  /** Left `null` on no change */
  action: AT | null;
};

export type AuditAction = BlockAuditAction | 'move';
