import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import BcToken from './BcToken';
import Collection from './Collection';

@Table({
  tableName: 'collection_payment_tokens',
  modelName: 'CollectionPaymentToken',
  timestamps: false,
  underscored: true,
})
export default class CollectionPaymentToken extends Model {
  @ForeignKey(() => Collection)
  @Column
  collectionId!: number;

  @ForeignKey(() => BcToken)
  @Column
  bcTokenId!: number;
}
