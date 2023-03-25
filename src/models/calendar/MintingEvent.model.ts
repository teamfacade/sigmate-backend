import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';
import { CalendarEvent, EventAttribs } from '.';
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

@Table({
  modelName: 'MintingEvent',
  tableName: 'minting_events',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class MintingEvent extends CalendarEvent<MintingEventAttribs> {
  @BelongsTo(() => Collection, 'collectionId')
  collection: MintingEventAttribs['collection'];

  @Column(DataType.DOUBLE)
  price: MintingEventAttribs['price'];

  @Column(DataType.DATE)
  priceUpdatedAt: MintingEventAttribs['price'];

  @BelongsTo(() => Chain, { foreignKey: 'chainSymbol', as: 'chain' })
  chain: MintingEventAttribs['chain'];
}
