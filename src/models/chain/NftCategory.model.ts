import {
  AllowNull,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { Collection } from './Collection.model';

export interface NftCategoryAttribs {
  id: number;
  name: string;
  collections?: Collection[];
}

type NftCategoryCAttribs = Optional<NftCategoryAttribs, 'id'>;

@Table({
  modelName: 'NftCategory',
  tableName: 'nft_categories',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'uft8mb4',
  collate: 'utf8mb4_general_ci',
})
export class NftCategory extends Model<
  NftCategoryAttribs,
  NftCategoryCAttribs
> {
  @Unique('nft_categories.name')
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: NftCategoryAttribs['name'];

  @HasMany(() => Collection, 'categoryId')
  collections: NftCategoryAttribs['collections'];
}
