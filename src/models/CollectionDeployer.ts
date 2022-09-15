import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';

export interface CollectionDeployerAttributes {
  id: number;
  address: string;
  collection?: Collection;
}

export type CollectionDeployerCreationAttributes = Optional<
  CollectionDeployerAttributes,
  'id'
>;

@Table({
  tableName: 'collection_deployers',
  modelName: 'CollectionDeployer',
  timestamps: true,
  underscored: true,
})
export default class CollectionDeployer extends Model<
  CollectionDeployerAttributes,
  CollectionDeployerCreationAttributes
> {
  @Column(DataType.STRING(50))
  address!: CollectionDeployerAttributes['address'];

  @BelongsTo(() => Collection, 'collectionId')
  collection: CollectionDeployerAttributes['collection'];
}
