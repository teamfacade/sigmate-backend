import { model } from 'dynamoose';
import { Item } from 'dynamoose/dist/Item';
import DocumentVersionSchema from '../../schemas/wiki/document.schema';

type DocumentRawAttribs = sigmate.Wiki.DocumentRawAttribs;

export class DocumentVersionItem extends Item {
  WikiPK!: DocumentRawAttribs['WikiPK'];
  WikiSK!: DocumentRawAttribs['WikiSK'];
  Type!: DocumentRawAttribs['Type'];
  Title!: DocumentRawAttribs['Title'];
  KeyInfo!: DocumentRawAttribs['KeyInfo'];
  Content!: DocumentRawAttribs['Content'];
  Tags!: DocumentRawAttribs['Tags'];
  ExtClId: DocumentRawAttribs['ExtClId'];
  ExtNftId: DocumentRawAttribs['ExtNftId'];
  ExtClName: DocumentRawAttribs['ExtClName'];
  ExtClDiscord: DocumentRawAttribs['ExtClDiscord'];
  ExtClTwitter: DocumentRawAttribs['ExtClTwitter'];
  ExtClTelegram: DocumentRawAttribs['ExtClTelegram'];
  ExtClWebsite: DocumentRawAttribs['ExtClWebsite'];
  ExtClChains: DocumentRawAttribs['ExtClChains'];
  ExtClMarketplaces: DocumentRawAttribs['ExtClMarketplaces'];
  ExtClCategory: DocumentRawAttribs['ExtClCategory'];
  ExtClFloorPrice: DocumentRawAttribs['ExtClFloorPrice'];
  ExtClMintingPrices: DocumentRawAttribs['ExtClMintingPrices'];
  Version?: DocumentRawAttribs['Version'];
  IsLatest!: DocumentRawAttribs['IsLatest'];
  BuildVersionStart!: DocumentRawAttribs['BuildVersionStart'];
  BuildVersionEnd!: DocumentRawAttribs['BuildVersionEnd'];
  Action!: DocumentRawAttribs['Action'];
  Diff!: DocumentRawAttribs['Diff'];
  AuditedBy!: DocumentRawAttribs['AuditedBy'];
  AuditComment?: DocumentRawAttribs['AuditComment'];
  Schema!: DocumentRawAttribs['Schema'];
}

const DocumentVersion = model<DocumentVersionItem>(
  'DocumentVersion',
  DocumentVersionSchema,
  { initialize: false }
);

export default DocumentVersion;
