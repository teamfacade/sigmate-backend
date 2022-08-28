import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';
import User from './User';
import UserDevice from './UserDevice';

export interface CollectionUtilityAttributes {
  id: number;
  name: string;
  collections?: Collection[];
  createdBy: User;
  createdByDevice: UserDevice;
  updatedBy?: User;
  updatedByDevice?: UserDevice;
}

export type CollectionUtilityCreationAttributes = Optional<
  CollectionUtilityAttributes,
  'id'
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
  @AllowNull(false)
  @Column(DataType.STRING(64))
  name!: CollectionUtilityAttributes['name'];

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
}
