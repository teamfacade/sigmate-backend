import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';
import User from './User';
import UserDevice from './UserDevice';

export interface NftAttributes {
  id: number;
  collection: Collection;
  contractAddress: string;
  tokenNumber: number;
  imageUrl: string;
  createdBy?: User;
  createdByDevice?: UserDevice;
}

export type NftCreationAttributes = Optional<NftAttributes, 'id'>;

@Table({
  tableName: 'nfts',
  modelName: 'Nft',
  timestamps: true,
  underscored: true,
})
export default class Nft extends Model<NftAttributes, NftCreationAttributes> {
  @BelongsTo(() => Collection, 'collectionId')
  collection!: NftAttributes['collection'];

  @AllowNull(false)
  @Column(DataType.STRING(64))
  contractAddress!: NftAttributes['contractAddress'];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  tokenNumber!: NftAttributes['tokenNumber'];

  @Column(DataType.STRING(1024))
  imageUrl!: NftAttributes['imageUrl'];

  @BelongsTo(() => User, 'createdById')
  createdBy: NftAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice: NftAttributes['createdByDevice'];
}
