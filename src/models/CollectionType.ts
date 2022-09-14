import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';
import User from './User';
import UserDevice from './UserDevice';

export interface CollectionTypeAttributes {
  id: number;
  name: string;
  collections?: Collection[];
  createdBy?: User;
  createdByDevice?: UserDevice;
  updatedBy?: User;
  updatedByDevice?: UserDevice;
}

export type CollectionTypeCreationAttributes = Optional<
  CollectionTypeAttributes,
  'id'
>;

export interface CollectionTypeFindOrCreateDTO
  extends Omit<CollectionTypeCreationAttributes, 'collections'> {
  collection?: Collection;
}

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
  @Unique('name')
  @AllowNull(false)
  @Column(DataType.STRING(64))
  name!: CollectionTypeAttributes['name'];

  @HasMany(() => Collection, 'collectionTypeId')
  collections: CollectionTypeAttributes['collections'];

  @BelongsTo(() => User, 'createdById')
  createdBy: CollectionTypeAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice: CollectionTypeAttributes['createdByDevice'];

  @BelongsTo(() => User, 'updatedById')
  updatedBy: CollectionTypeAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, 'updatedByDeviceId')
  updatedByDevice: CollectionTypeAttributes['updatedByDevice'];
}
