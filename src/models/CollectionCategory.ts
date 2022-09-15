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
import CollectionUtility from './CollectionUtility';
import User, { UserAttributes } from './User';
import UserDevice from './UserDevice';

export interface CollectionCategoryAttributes {
  id: number;
  name: string;
  collections?: Collection[];
  utilities?: CollectionUtility[];
  createdById?: UserAttributes['id'];
  createdBy?: User;
  createdByDeviceId?: UserAttributes['id'];
  createdByDevice?: UserDevice;
  updatedBy?: User;
  updatedByDevice?: UserDevice;
}

export type CollectionCategoryCreationAttributes = Optional<
  CollectionCategoryAttributes,
  'id'
>;

export interface CollectionCategoryFindOrCreateDTO
  extends Omit<CollectionCategoryCreationAttributes, 'collections'> {
  collection?: Collection;
}

export type CollectionCategoryCreationDTO = Pick<
  CollectionCategoryCreationAttributes,
  'name' | 'createdBy' | 'createdByDevice'
>;

export type CollectionCategoryResponse = Pick<
  CollectionCategoryAttributes,
  'id' | 'name'
>;

@Table({
  tableName: 'collection_categories',
  modelName: 'CollectionCategory',
  underscored: true,
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class CollectionCategory extends Model<
  CollectionCategoryAttributes,
  CollectionCategoryCreationAttributes
> {
  @Unique('name')
  @AllowNull(false)
  @Column(DataType.STRING(64))
  name!: CollectionCategoryAttributes['name'];

  @HasMany(() => Collection, 'collectionCategoryId')
  collections: CollectionCategoryAttributes['collections'];

  @HasMany(() => CollectionUtility, 'collectionCategoryId')
  utilities: CollectionCategoryAttributes['utilities'];

  @BelongsTo(() => User, 'createdById')
  createdBy: CollectionCategoryAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice: CollectionCategoryAttributes['createdByDevice'];

  @BelongsTo(() => User, 'updatedById')
  updatedBy: CollectionCategoryAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, 'updatedByDeviceId')
  updatedByDevice: CollectionCategoryAttributes['updatedByDevice'];

  toResponseJSON(): CollectionCategoryResponse {
    return {
      id: this.id,
      name: this.name,
    };
  }
}
