import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  IsIn,
  Model,
  Table,
} from 'sequelize-typescript';
import { Includeable, Optional } from 'sequelize/types';
import { EventAttribs } from '.';
import { Chain, ChainAttribs } from '../chain/Chain.model';
import { Collection, CollectionAttribs } from '../chain/Collection.model';

export interface MintingEventAttribs extends EventAttribs {
  collection?: Collection;
  collectionId?: CollectionAttribs['id'];
  price?: number;
  priceUpdatedAt?: Date;
  chain?: Chain;
  chainSymbol?: ChainAttribs['symbol'];
}

type MintingEventCAttribs = Optional<MintingEventAttribs, 'id'>;

@Table({
  modelName: 'MintingEvent',
  tableName: 'minting_events',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class MintingEvent extends Model<
  MintingEventAttribs,
  MintingEventCAttribs
> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: MintingEventAttribs['name'];

  @Column(DataType.TEXT)
  description: MintingEventAttribs['description'];

  @AllowNull(false)
  @Column(DataType.DATE)
  startsAt!: MintingEventAttribs['startsAt'];

  @IsIn([['month', 'week', 'day', 'time']])
  @Default('time')
  @AllowNull(false)
  @Column(DataType.STRING(8))
  startsAtPrecision!: MintingEventAttribs['startsAtPrecision'];

  @Column(DataType.DATE)
  endsAt: MintingEventAttribs['endsAt'];

  @IsIn([['month', 'week', 'day', 'time']])
  @Column(DataType.STRING(8))
  endsAtPrecision: MintingEventAttribs['endsAtPrecision'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isAllday!: MintingEventAttribs['isAllday'];

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  savedCount!: MintingEventAttribs['savedCount'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: MintingEventAttribs['createdAt'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: MintingEventAttribs['updatedAt'];

  @BelongsTo(() => Collection, 'collectionId')
  collection: MintingEventAttribs['collection'];

  @Column(DataType.DOUBLE)
  price: MintingEventAttribs['price'];

  @Column(DataType.DATE)
  priceUpdatedAt: MintingEventAttribs['priceUpdatedAt'];

  @BelongsTo(() => Chain, { foreignKey: 'chainSymbol', as: 'chain' })
  chain: MintingEventAttribs['chain'];

  static INCLUDE_OPTS: Record<'chain', Includeable[]> = {
    chain: [{ model: Chain, as: 'chain' }],
  };
}
