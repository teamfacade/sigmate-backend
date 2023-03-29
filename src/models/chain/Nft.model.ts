import {
  Table,
  Model,
  Column,
  DataType,
  AllowNull,
  BelongsTo,
  Default,
  Unique,
  BelongsToMany,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { CollectionId, Collection } from './Collection.model';
import { NftTag } from './NftTag.model';
import { WikiTag } from '../wiki/WikiTag.model';

export type NftId = string;
export interface NftAttribs {
  id: number;

  // {tokenName} #{tokenId} (e.g. Bellygom #9999)
  tokenName: string;
  tokenId: number;

  imageUrl?: string;
  contractAddress?: string;
  collection?: Collection;
  collectionId?: CollectionId;
  tags?: WikiTag[];
  createdAt: Date;
}

type NftCAttribs = Optional<NftAttribs, 'id' | 'createdAt'>;

@Table({
  modelName: 'Nft',
  tableName: 'nfts',
  timestamps: false,
})
export class Nft extends Model<NftAttribs, NftCAttribs> {
  @Unique('nft.token_nameid')
  @AllowNull(false)
  @Column(DataType.STRING)
  tokenName!: NftAttribs['tokenName'];

  @Unique('nft.token_nameid')
  @AllowNull(false)
  @Column(DataType.INTEGER)
  tokenId!: NftAttribs['tokenId'];

  @Column(DataType.STRING(512))
  imageUrl: NftAttribs['imageUrl'];

  @Column(DataType.STRING(64))
  contractAddress: NftAttribs['contractAddress'];

  @BelongsTo(() => Collection, 'collectionId')
  collection: NftAttribs['collection'];

  @BelongsToMany(() => WikiTag, {
    through: () => NftTag,
    foreignKey: 'nftId',
    otherKey: 'tagId',
  })
  tags: NftAttribs['tags'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: NftAttribs['createdAt'];
}
