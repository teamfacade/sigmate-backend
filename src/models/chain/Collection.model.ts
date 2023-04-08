import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Includeable, Optional } from 'sequelize/types';
import { Chain } from './Chain.model';
import { CollectionChain } from './CollectionChain.model';
import { CollectionMarketplace } from './CollectionMarketplace.model';
// import { CollectionTag } from './CollectionTag.model';
import { Nft } from './Nft.model';
import { NftCategoryAttribs, NftCategory } from './NftCategory.model';
import { Marketplace } from './Marketplace.model';
// import { WikiTag } from '../wiki/WikiTag.model';
import { MintingEvent } from '../calendar/MintingEvent.model';

export type CollectionId = string;

export interface CollectionAttribs {
  id: number;
  slug: string;
  name: string;
  description?: string;
  document?: sigmate.Wiki.DocumentId;

  discordUrl?: string;
  discordUpdatedAt?: Date;
  telegramUrl?: string;
  telegramUpdatedAt?: Date;
  twitterUrl?: string;
  twitterUpdatedAt?: Date;
  websiteUrl?: string;
  websiteUpdatedAt?: Date;

  imageUrl?: string;
  bannerImageUrl?: string;
  imageUpdatedAt?: Date;

  // Price cache
  floorPrice?: number;
  floorPriceUpdatedAt?: Date;
  floorPriceCurrency?: Chain;
  mintings?: MintingEvent[];

  marketplaces?: Marketplace[];
  chains?: Chain[];
  category?: NftCategory;
  categoryId?: NftCategoryAttribs['id'];
  // tags?: WikiTag;
  nfts?: Nft[];

  createdAt: Date;
  deletedAt?: Date;
}

type CollectionCAttribs = Optional<CollectionAttribs, 'id' | 'createdAt'>;

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

  @Unique('collection.document')
  @Column(DataType.STRING(32))
  document: CollectionAttribs['document'];

  @Column(DataType.STRING)
  discordUrl: CollectionAttribs['discordUrl'];

  @Column(DataType.DATE)
  discordUpdatedAt: CollectionAttribs['discordUpdatedAt'];

  @Column(DataType.STRING)
  telegramUrl: CollectionAttribs['telegramUrl'];

  @Column(DataType.DATE)
  telegramUpdatedAt: CollectionAttribs['telegramUpdatedAt'];

  @Column(DataType.STRING)
  twitterUrl: CollectionAttribs['twitterUrl'];

  @Column(DataType.DATE)
  twitterUpdatedAt: CollectionAttribs['twitterUpdatedAt'];

  @Column(DataType.STRING)
  websiteUrl: CollectionAttribs['websiteUrl'];

  @Column(DataType.DATE)
  websiteUpdatedAt: CollectionAttribs['websiteUpdatedAt'];

  @Column(DataType.STRING(512))
  imageUrl: CollectionAttribs['imageUrl'];

  @Column(DataType.STRING(512))
  bannerImageUrl: CollectionAttribs['bannerImageUrl'];

  @Column(DataType.DATE)
  imageUpdatedAt: CollectionAttribs['imageUpdatedAt'];

  @Column(DataType.DOUBLE)
  floorPrice: CollectionAttribs['floorPrice'];

  @Column(DataType.DATE)
  floorPriceUpdatedAt: CollectionAttribs['floorPriceUpdatedAt'];

  @BelongsTo(() => Chain, {
    foreignKey: 'floorPriceCurrencyId',
    as: 'floorPriceCurrency',
  })
  floorPriceCurrency: CollectionAttribs['floorPriceCurrency'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: CollectionAttribs['createdAt'];

  @Column(DataType.DATE)
  deletedAt: CollectionAttribs['deletedAt'];

  @HasMany(() => MintingEvent, { foreignKey: 'collectionId', as: 'mintings' })
  mintings: CollectionAttribs['mintings'];

  @BelongsTo(() => NftCategory, { foreignKey: 'categoryId' })
  category: CollectionAttribs['category'];

  // @BelongsToMany(() => WikiTag, {
  //   through: () => CollectionTag,
  //   foreignKey: 'collectionId',
  //   otherKey: 'tagId',
  // })
  // tags: CollectionAttribs['tags'];

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
    otherKey: 'chainSymbol',
    as: 'chains',
  })
  chains: CollectionAttribs['chains'];

  @HasMany(() => Nft, { foreignKey: 'collectionId' })
  nfts: CollectionAttribs['nfts'];

  static INCLUDE_OPTS: Record<
    'floorPrice' | 'marketplaces' | 'mintings' | 'category' | 'chains',
    Includeable[]
  > = {
    floorPrice: [
      {
        model: Chain,
        attributes: Chain.FIND_ATTRIBS.base,
        as: 'floorPriceCurrency',
      },
    ],
    marketplaces: [
      { model: Marketplace, include: Marketplace.INCLUDE_OPTS.logoImage },
    ],
    mintings: [
      { model: MintingEvent, include: MintingEvent.INCLUDE_OPTS.chain },
    ],
    category: [{ model: NftCategory }],
    chains: [
      { model: Chain, attributes: Chain.FIND_ATTRIBS.base, as: 'chains' },
    ],
  };
}
