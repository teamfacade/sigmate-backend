import { BelongsTo, Model, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block from './Block';
import User from './User';
import UserDevice from './UserDevice';

export interface CollectionDocumentTableAttributes {
  id: number;
  teamBlock: Block;
  rugpoolBlock: Block;
  typeBlock: Block;
  utilityBlock: Block;
  mintingPriceWLBlock: Block;
  mintingPricePublicBlock: Block;
  currentPriceBlock: Block;
  discordUrlBlock: Block;
  twitterUrlBlock: Block;
  websiteUrlBlock: Block;
  blockchainBlock: Block;
  marketplaceBlock: Block;
  createdBy: User;
  createdByDevice: UserDevice;
  updatedBy?: User;
  updatedByDevice?: UserDevice;
}

export type CollectionDocumentTableCreationAttributes = Optional<
  CollectionDocumentTableAttributes,
  'id'
>;

@Table({
  tableName: 'collection_document_tables',
  modelName: 'CollectionDocumentTable',
  timestamps: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class CollectionDocumentTable extends Model<
  CollectionDocumentTableAttributes,
  CollectionDocumentTableCreationAttributes
> {
  @BelongsTo(() => Block, 'teamBlockId')
  teamBlock!: CollectionDocumentTableAttributes['teamBlock'];

  @BelongsTo(() => Block, 'rugpoolBlockId')
  rugpoolBlock!: CollectionDocumentTableAttributes['rugpoolBlock'];

  @BelongsTo(() => Block, 'typeBlockId')
  typeBlock!: CollectionDocumentTableAttributes['typeBlock'];

  @BelongsTo(() => Block, 'utilityBlockId')
  utilityBlock!: CollectionDocumentTableAttributes['utilityBlock'];

  @BelongsTo(() => Block, 'mintingPriceWLBlockId')
  mintingPriceWLBlock!: CollectionDocumentTableAttributes['mintingPriceWLBlock'];

  @BelongsTo(() => Block, 'mintingPricePublicBlockId')
  mintingPricePublicBlock!: CollectionDocumentTableAttributes['mintingPricePublicBlock'];

  @BelongsTo(() => Block, 'currentPriceBlockId')
  currentPriceBlock!: CollectionDocumentTableAttributes['currentPriceBlock'];

  @BelongsTo(() => Block, 'discordUrlBlockId')
  discordUrlBlock!: CollectionDocumentTableAttributes['discordUrlBlock'];

  @BelongsTo(() => Block, 'twitterUrlBlockId')
  twitterUrlBlock!: CollectionDocumentTableAttributes['twitterUrlBlock'];

  @BelongsTo(() => Block, 'websiteUrlBlockId')
  websiteUrlBlock!: CollectionDocumentTableAttributes['websiteUrlBlock'];

  @BelongsTo(() => Block, 'blockchainBlockId')
  blockchainBlock!: CollectionDocumentTableAttributes['blockchainBlock'];

  @BelongsTo(() => Block, 'marketplaceBlockId')
  marketplaceBlock!: CollectionDocumentTableAttributes['marketplaceBlock'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: CollectionDocumentTableAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: CollectionDocumentTableAttributes['createdByDevice'];

  @BelongsTo(() => User, 'updatedById')
  updatedBy: CollectionDocumentTableAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, 'updatedByDeviceId')
  updatedByDevice: CollectionDocumentTableAttributes['updatedByDevice'];
}
