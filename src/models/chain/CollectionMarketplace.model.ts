import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { CollectionAttribs, Collection } from './Collection.model';
import { MarketplaceAttribs, Marketplace } from './Marketplace.model';

export interface CollectionMarketplaceAttribs {
  collectionId: CollectionAttribs['id'];
  marketplaceId: MarketplaceAttribs['id'];
  /** Url to the marketplace's collection details page */
  collectionUrl?: string;
  /** Collection is not open on the marketplace yet, but will be available from this date */
  availableFrom?: Date;
}

@Table({
  modelName: 'CollectionMarketplace',
  tableName: 'collection_marketplaces',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class CollectionMarketplace extends Model {
  @ForeignKey(() => Collection)
  @Column
  collectionId!: CollectionAttribs['id'];

  @ForeignKey(() => Marketplace)
  @Column
  marketplaceId!: MarketplaceAttribs['id'];

  @Column(DataType.STRING(512))
  collectionUrl: CollectionMarketplaceAttribs['collectionUrl'];

  @Column(DataType.DATE)
  availableFrom: CollectionMarketplaceAttribs['availableFrom'];
}
