import { model } from 'dynamoose';
import { Item } from 'dynamoose/dist/Item';
import BlockVersionSchema from '../../schemas/wiki/block.schema';

type BlockRawAttribs = sigmate.Wiki.BlockRawAttribs;

export class BlockVersionItem extends Item {
  WikiPK!: BlockRawAttribs['WikiPK'];
  WikiSK!: BlockRawAttribs['WikiSK'];
  WikiGSIPK: BlockRawAttribs['WikiGSIPK'];
  WikiGSISK: BlockRawAttribs['WikiGSISK'];
  Type!: BlockRawAttribs['Type'];
  Data!: BlockRawAttribs['Data'];
  KeyInfo: BlockRawAttribs['KeyInfo'];
  Ext: BlockRawAttribs['Ext'];
  Version: BlockRawAttribs['Version'];
  IsLatest!: BlockRawAttribs['IsLatest'];
  Action!: BlockRawAttribs['Action'];
  Diff!: BlockRawAttribs['Diff'];
  DocumentVersion?: BlockRawAttribs['DocumentVersion'];
  VfCntPosVr!: BlockRawAttribs['VfCntPosVr'];
  VfCntNegBA!: BlockRawAttribs['VfCntNegBA'];
  AuditedBy!: BlockRawAttribs['AuditedBy'];
  Schema!: BlockRawAttribs['Schema'];
}

const BlockVersion = model<BlockVersionItem>(
  'BlockVersion',
  BlockVersionSchema,
  { initialize: false }
);

export default BlockVersion;
