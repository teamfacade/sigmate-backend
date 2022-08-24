import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User from './User';
import UserDevice from './UserDevice';

export interface CollectionTypeAttributes {
  id: number;
  name: string;
  createdBy: User;
  createdByDevice: UserDevice;
}

export type CollectionTypeCreationAttributes = Optional<
  CollectionTypeAttributes,
  'id'
>;

@Table({
  tableName: 'collection_types',
  modelName: 'CollectionType',
  underscored: true,
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class CollectionType extends Model<
  CollectionTypeAttributes,
  CollectionTypeCreationAttributes
> {
  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(64))
  name!: CollectionTypeAttributes['name'];

  @AllowNull(false)
  @BelongsTo(() => User)
  createdBy!: CollectionTypeAttributes['createdBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice)
  createdByDevice!: CollectionTypeAttributes['createdByDevice'];
}
