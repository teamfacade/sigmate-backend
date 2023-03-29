import { model } from 'dynamoose';
import { Item } from 'dynamoose/dist/Item';
import DocumentVersionSchema from '../../schemas/wiki/document.schema';

type DocumentAttribs = sigmate.Wiki.DocumentRawItemAttribs;

export class DocumentVersionItem extends Item {
  /** `Document::{DOCUMENT_ID} */
  WikiPK!: DocumentAttribs['WikiPK'];
  /**
   * `Document::v_{DOCUMENT_VERSION}`
   * * `DOCUMENT_VERSION`: Document version ID. `latest` for latest version
   */
  WikiSK!: DocumentAttribs['WikiSK'];
  Type!: DocumentAttribs['Type'];
  Title!: DocumentAttribs['Title'];
  KeyInfo!: DocumentAttribs['KeyInfo'];
  Content!: DocumentAttribs['Content'];
  Tags!: DocumentAttribs['Tags'];

  /**
   * Version of the document.
   * Only kept on latest version copies since the sort key does not
   * contain the document version
   */
  DocumentVersion?: DocumentAttribs['DocumentVersion'];
  /** Overall audit action on this version */
  DocumentAction!: DocumentAttribs['DocumentAction'];
  /** Audits made to each attribute */
  AttribActions!: DocumentAttribs['AttribActions'];
  AuditedBy!: DocumentAttribs['AuditedBy'];
  /** Comment from the user who created this version */
  AuditComment?: DocumentAttribs['AuditComment'];
}

const DocumentVersion = model<DocumentVersionItem>(
  'DocumentVersion',
  DocumentVersionSchema,
  { initialize: false }
);

export default DocumentVersion;
