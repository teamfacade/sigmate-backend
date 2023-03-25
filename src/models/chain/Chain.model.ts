import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { ImageFile, ImageFileId } from '../ImageFile.model';
import { Collection } from './Collection.model';
import { CollectionChain } from './CollectionChain.model';

export interface ChainAttribs {
  symbol: string; // primary key
  name: string;
  address?: string;
  decimals: number;
  icon?: ImageFile;
  iconId?: ImageFileId;
  collections?: Collection[];
}

@Table({
  modelName: 'Chain',
  tableName: 'chains',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class Chain extends Model<ChainAttribs> {
  @PrimaryKey
  @Column(DataType.STRING(16))
  symbol!: ChainAttribs['symbol'];

  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: ChainAttribs['name'];

  @Column(DataType.STRING(64))
  address: ChainAttribs['address'];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  decimals!: ChainAttribs['decimals'];

  @BelongsTo(() => ImageFile, 'iconId')
  icon: ChainAttribs['icon'];

  @BelongsToMany(() => Collection, {
    through: () => CollectionChain,
    foreignKey: 'chainId',
    otherKey: 'collectionid',
  })
  collections: ChainAttribs['collections'];
}
