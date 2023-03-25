import { User, UserId } from '../../models/User.model';
import {
  AnyBlockData,
  BlockAttribActions,
  BlockItemExternalData,
  BlockType,
} from '../../models/wiki/WikiBlock.schema';
import { BlockAuditAction } from '../../models/wiki/WikiDocument.schema';
import { DropletId } from '../droplet';

export default class WikiBlock {
  // DynamoDB
  id: DropletId; // Block ID
  type: BlockType;
  data: AnyBlockData | null;
  keyInfo?: {
    name: string;
    label?: string;
  };
  external?: Record<string, BlockItemExternalData>;
  version: DropletId | 'latest'; // Block version ID
  document: DropletId; // Document Id
  documentVersion: DropletId; // Document version ID
  blockAction: BlockAuditAction | null;
  attribActions: Partial<BlockAttribActions>;
  updatedById: UserId;
  createdById?: UserId;
  schema: 1;

  // SQL
  updatedBy: User;
  createdBy?: User;
}
