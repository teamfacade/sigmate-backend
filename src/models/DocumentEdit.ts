import User from './User';

export type DocumentEditIdType = number;

export interface DocumentEditModelAttributes {
  id: DocumentEditIdType;
  type: string; // C: create, U: update, D: delete
  diff: string;
  document: Document; // not null
  block: any; // TODO if empty, a document-level edit. if not empty, a block-level edit
  approvedBy: User;
  approvedAt: Date;
}
