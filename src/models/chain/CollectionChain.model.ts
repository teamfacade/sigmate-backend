import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ChainAttribs, Chain } from './Chain.model';
import { CollectionAttribs, Collection } from './Collection.model';

@Table({
  modelName: 'CollectionChain',
  tableName: 'collection_chains',
  timestamps: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class CollectionChain extends Model {
  @ForeignKey(() => Collection)
  @Column
  collectionId!: CollectionAttribs['id'];

  @ForeignKey(() => Chain)
  @Column
  chainId!: ChainAttribs['id'];
}
