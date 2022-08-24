import { AllowNull, BelongsTo, Model } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block from './Block';

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
}

export type CollectionDocumentTableCreationAttributes = Optional<
  CollectionDocumentTableAttributes,
  'id'
>;

export default class CollectionDocumentTable extends Model<
  CollectionDocumentTableAttributes,
  CollectionDocumentTableCreationAttributes
> {
  @AllowNull(false)
  @BelongsTo(() => Block, 'teamBlockId')
  teamBlock!: CollectionDocumentTableAttributes['teamBlock'];

  @AllowNull(false)
  @BelongsTo(() => Block, 'rugpoolBlockId')
  rugpoolBlock!: CollectionDocumentTableAttributes['rugpoolBlock'];

  @AllowNull(false)
  @BelongsTo(() => Block, 'typeBlockId')
  typeBlock!: CollectionDocumentTableAttributes['typeBlock'];

  @AllowNull(false)
  @BelongsTo(() => Block, 'utilityBlockId')
  utilityBlock!: CollectionDocumentTableAttributes['utilityBlock'];

  @AllowNull(false)
  @BelongsTo(() => Block, 'mintingPriceWLBlockId')
  mintingPriceWLBlock!: CollectionDocumentTableAttributes['mintingPriceWLBlock'];

  @AllowNull(false)
  @BelongsTo(() => Block, 'mintingPricePublicBlockId')
  mintingPricePublicBlock!: CollectionDocumentTableAttributes['mintingPricePublicBlock'];

  @AllowNull(false)
  @BelongsTo(() => Block, 'currentPriceBlockId')
  currentPriceBlock!: CollectionDocumentTableAttributes['currentPriceBlock'];

  @AllowNull(false)
  @BelongsTo(() => Block, 'discordUrlBlockId')
  discordUrlBlock!: CollectionDocumentTableAttributes['discordUrlBlock'];

  @AllowNull(false)
  @BelongsTo(() => Block, 'twitterUrlBlockId')
  twitterUrlBlock!: CollectionDocumentTableAttributes['twitterUrlBlock'];

  @AllowNull(false)
  @BelongsTo(() => Block, 'websiteUrlBlockId')
  websiteUrlBlock!: CollectionDocumentTableAttributes['websiteUrlBlock'];

  @AllowNull(false)
  @BelongsTo(() => Block, 'blockchainBlockId')
  blockchainBlock!: CollectionDocumentTableAttributes['blockchainBlock'];

  @AllowNull(false)
  @BelongsTo(() => Block, 'marketplaceBlockId')
  marketplaceBlock!: CollectionDocumentTableAttributes['marketplaceBlock'];
}
