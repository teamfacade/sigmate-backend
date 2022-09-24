import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';
import CollectionPaymentToken from './CollectionPaymentToken';

// BcToken: Blockchain tokens

export interface BcTokenAttributes {
  id: number;
  name: string;
  symbol: string;
  address: string;
  imageUrl?: string;
  decimals: number;
  collections?: Collection[];
}

export type BcTokenCreationAttributes = Optional<BcTokenAttributes, 'id'>;

export type BcTokenRequest = Omit<BcTokenResponse, 'symbol'> &
  Required<Pick<BcTokenResponse, 'symbol'>>;

export type BcTokenResponse = Pick<
  BcTokenAttributes,
  'id' | 'name' | 'symbol' | 'address' | 'imageUrl' | 'decimals'
>;

@Table({
  tableName: 'bc_tokens',
  modelName: 'BcToken',
  timestamps: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class BcToken extends Model<
  BcTokenAttributes,
  BcTokenCreationAttributes
> {
  @Column(DataType.STRING(191))
  name!: BcTokenAttributes['name'];

  @AllowNull(false)
  @Column(DataType.STRING(10))
  symbol!: BcTokenAttributes['symbol'];

  @AllowNull(false)
  @Column(DataType.STRING(50))
  address!: BcTokenAttributes['address'];

  @Column(DataType.STRING(1024))
  imageUrl: BcTokenAttributes['imageUrl'];

  @Column(DataType.INTEGER)
  decimals!: BcTokenAttributes['decimals'];

  @BelongsToMany(() => Collection, () => CollectionPaymentToken)
  collections: BcTokenAttributes['collections'];
}
