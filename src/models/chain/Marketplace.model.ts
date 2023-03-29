import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Includeable } from 'sequelize/types';
import { ImageFile, ImageFileId } from '../ImageFile.model';
import { Collection } from './Collection.model';
import { CollectionMarketplace } from './CollectionMarketplace.model';

export interface MarketplaceAttribs {
  id: number;
  name: string;
  url: string;
  logoImage?: ImageFile;
  logoImageId?: ImageFileId;
  collections?: Collection[];
}

@Table({
  modelName: 'Marketplace',
  tableName: 'marketplaces',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class Marketplace extends Model<MarketplaceAttribs> {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: MarketplaceAttribs['name'];

  @AllowNull(false)
  @Column(DataType.STRING(512))
  url!: MarketplaceAttribs['url'];

  @BelongsTo(() => ImageFile, { foreignKey: 'logoImageId', as: 'logoImage' })
  logoImage: MarketplaceAttribs['logoImage'];

  @BelongsToMany(() => Collection, {
    through: () => CollectionMarketplace,
    foreignKey: 'marketplaceId',
    otherKey: 'collectionId',
  })
  collections: MarketplaceAttribs['collections'];

  CollectionMarketplace?: CollectionMarketplace;

  static INCLUDE_OPTS: Record<'logoImage', Includeable[]> = {
    logoImage: [{ model: ImageFile, as: 'logoImage' }],
  };
}
