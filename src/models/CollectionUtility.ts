import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';
import CollectionCategory, {
  CollectionCategoryAttributes,
} from './CollectionCategory';
import User, { UserAttributes } from './User';
import UserDevice, { UserDeviceAttributes } from './UserDevice';

export interface CollectionUtilityAttributes {
  id: number;
  name: string;
  collections?: Collection[];
  collectionCategoryId?: CollectionCategoryAttributes['id'];
  category?: CollectionCategory;
  createdById?: UserAttributes['id'];
  createdBy?: User;
  createdByDeviceId?: UserDeviceAttributes['id'];
  createdByDevice?: UserDevice;
  updatedById?: UserAttributes['id'];
  updatedBy?: User;
  updatedByDeviceId?: UserDeviceAttributes['id'];
  updatedByDevice?: UserDevice;
}

export type CollectionUtilityCreationAttributes = Optional<
  CollectionUtilityAttributes,
  'id'
>;

export interface CollectionUtilityFindOrCreateDTO
  extends Omit<CollectionUtilityCreationAttributes, 'collections'> {
  collection?: Collection;
}

export type CollectionUtilityCreationDTO = Pick<
  CollectionUtilityCreationAttributes,
  | 'name'
  | 'createdBy'
  | 'createdByDevice'
  | 'createdById'
  | 'createdByDeviceId'
  | 'collectionCategoryId'
  | 'category'
>;

export type CollectionUtilityResponse = Pick<
  CollectionUtilityAttributes,
  'id' | 'name' | 'category'
>;

@Table({
  tableName: 'collection_utilities',
  modelName: 'CollectionUtility',
  underscored: true,
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class CollectionUtility extends Model<
  CollectionUtilityAttributes,
  CollectionUtilityCreationAttributes
> {
  @Unique('name')
  @AllowNull(false)
  @Column(DataType.STRING(64))
  name!: CollectionUtilityAttributes['name'];

  @Unique('name')
  @ForeignKey(() => CollectionCategory)
  @Column(DataType.INTEGER)
  collectionCategoryId: CollectionUtilityAttributes['collectionCategoryId'];

  @BelongsTo(() => CollectionCategory, 'collectionCategoryId')
  category: CollectionUtilityAttributes['category'];

  @HasMany(() => Collection, 'collectionUtilityId')
  collections: CollectionUtilityAttributes['collections'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: CollectionUtilityAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: CollectionUtilityAttributes['createdByDevice'];

  @BelongsTo(() => User, 'updatedById')
  updatedBy: CollectionUtilityAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, 'updatedByDeviceId')
  updatedByDevice: CollectionUtilityAttributes['updatedByDevice'];

  toResponseJSON(): CollectionUtilityResponse {
    return {
      id: this.id,
      name: this.name,
      category: this.category || undefined,
    };
  }
}
