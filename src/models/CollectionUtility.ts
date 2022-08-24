import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User from './User';
import UserDevice from './UserDevice';

export interface CollectionUtilityAttributes {
  id: number;
  name: string;
  createdBy: User;
  createdByDevice: UserDevice;
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

  @AllowNull(false)
  @BelongsTo(() => User)
  createdBy!: CollectionUtilityAttributes['createdBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice)
  createdByDevice!: CollectionUtilityAttributes['createdByDevice'];
}
