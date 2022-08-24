import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';

export interface NFTAttributes {
  id: number;
  contractAddress: string;
  tokenNumber: number;
  collection: Collection;
  imageUrl: string;
}

export type NFTCreationAttributes = Optional<NFTAttributes, 'id'>;

export default class NFT extends Model<NFTAttributes, NFTCreationAttributes> {
  @AllowNull(false)
  @Column(DataType.STRING(64))
  contractAddress!: NFTAttributes['contractAddress'];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  tokenNumber!: NFTAttributes['tokenNumber'];

  @BelongsTo(() => Collection)
  collection!: NFTAttributes['collection'];

  @Column(DataType.STRING(1024))
  imageUrl!: NFTAttributes['imageUrl'];
}
