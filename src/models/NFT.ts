import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';
import User from './User';
import UserDevice from './UserDevice';

export interface NftAttributes {
  id: number;
  contractAddress: string;
  tokenNumber: number;
  collection: Collection;
  imageUrl: string;
  createdBy?: User;
  createdByDevice?: UserDevice;
}

export type NftCreationAttributes = Optional<NftAttributes, 'id'>;

export default class Nft extends Model<NftAttributes, NftCreationAttributes> {
  @AllowNull(false)
  @Column(DataType.STRING(64))
  contractAddress!: NftAttributes['contractAddress'];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  tokenNumber!: NftAttributes['tokenNumber'];

  @BelongsTo(() => Collection)
  collection!: NftAttributes['collection'];

  @Column(DataType.STRING(1024))
  imageUrl!: NftAttributes['imageUrl'];

  @BelongsTo(() => User)
  createdBy: NftAttributes['createdBy'];

  @BelongsTo(() => UserDevice)
  createdByDevice: NftAttributes['createdByDevice'];
}
