import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { Chain } from './Chain.model';
import { CollectionChain } from './CollectionChain.model';
import { CollectionMarketplace } from './CollectionMarketplace.model';
import { CollectionTag } from './CollectionTag.model';
import { Nft } from './Nft.model';
import { NftCategoryAttribs, NftCategory } from './NftCategory.model';
import { Marketplace } from './Marketplace.model';
import { WikiTag } from '../wiki/WikiTag.model';
import { MintingEvent } from '../calendar/MintingEvent.model';

export type CollectionId = string;

export interface CollectionAttribs {
  id: number;
  slug: string;
  name: string;
  description?: string;

  // Data synced with keyinfo block
  discordUrl?: string;
  isDiscordVerified?: boolean | null;
  telegramUrl?: string;
  isTelegramVerified?: boolean | null;
  twitterUrl?: string;
  isTwitterVerified?: boolean | null;
  websiteUrl?: string;
  isWebsiteVerified?: boolean | null;
  imageUrl?: string;
  bannerImageUrl?: string;

  // Price cache
  floorPrice?: number;
  mintings?: MintingEvent[];

  category?: NftCategory;
  categoryId?: NftCategoryAttribs['id'];
  tags?: WikiTag;
  marketplaces?: Marketplace[];
  chains?: Chain[];
  nfts?: Nft[];

  createdAt: Date;
  deletedAt?: Date;
}

type CollectionCAttribs = Optional<CollectionAttribs, 'id'>;

@Table({
  modelName: 'Collection',
  tableName: 'collections',
  timestamps: false,
  underscored: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class Collection extends Model<CollectionAttribs, CollectionCAttribs> {
  @Unique('collection.slug')
  @AllowNull(false)
  @Column(DataType.STRING)
  slug!: CollectionAttribs['slug'];

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: CollectionAttribs['name'];

  @Column(DataType.TEXT)
  description: CollectionAttribs['description'];

  @Column(DataType.STRING)
  discordUrl: CollectionAttribs['discordUrl'];

  @Column(DataType.BOOLEAN)
  isDiscordVerified: CollectionAttribs['isDiscordVerified'];

  @Column(DataType.STRING)
  telegramUrl: CollectionAttribs['telegramUrl'];

  @Column(DataType.BOOLEAN)
  isTelegramVerified: CollectionAttribs['isTelegramVerified'];

  @Column(DataType.STRING)
  twitterUrl: CollectionAttribs['twitterUrl'];

  @Column(DataType.BOOLEAN)
  isTwitterVerified: CollectionAttribs['isTwitterVerified'];

  @Column(DataType.STRING)
  websiteUrl: CollectionAttribs['websiteUrl'];

  @Column(DataType.BOOLEAN)
  isWebsiteVerified: CollectionAttribs['isWebsiteVerified'];

  @Column(DataType.STRING(512))
  imageUrl: CollectionAttribs['imageUrl'];

  @Column(DataType.STRING(512))
  bannerImageUrl: CollectionAttribs['bannerImageUrl'];

  @HasMany(() => MintingEvent, { foreignKey: 'collectionId', as: 'mintings' })
  mintings: CollectionAttribs['mintings'];

  @BelongsTo(() => NftCategory, { foreignKey: 'categoryId' })
  category: CollectionAttribs['category'];

  @BelongsToMany(() => WikiTag, {
    through: () => CollectionTag,
    foreignKey: 'collectionId',
    otherKey: 'tagId',
  })
  tags: CollectionAttribs['tags'];

  @BelongsToMany(() => Marketplace, {
    through: () => CollectionMarketplace,
    as: 'marketplaces',
    foreignKey: 'collectionId',
    otherKey: 'marketplaceId',
  })
  marketplaces: CollectionAttribs['marketplaces'];

  @BelongsToMany(() => Chain, {
    through: () => CollectionChain,
    foreignKey: 'collectionId',
    otherKey: 'chainId',
  })
  chains: CollectionAttribs['chains'];

  @HasMany(() => Nft, { foreignKey: 'collectionId' })
  nfts: CollectionAttribs['nfts'];
}
