import {
  DataType,
  Table,
  Model,
  Column,
  AllowNull,
  Unique,
  BelongsTo,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import UserDevice, { UserDeviceAttributes } from './UserDevice';

export interface WaitingListAttributes {
  id: number;
  email: string;
  createdByDeviceId?: UserDeviceAttributes['id'];
  createdByDevice?: UserDevice;
}

export type WaitingListCreationAttributes = Optional<
  WaitingListAttributes,
  'id'
>;

@Table({
  tableName: 'waiting_list',
  modelName: 'WaitingList',
  timestamps: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class WaitingList extends Model<
  WaitingListAttributes,
  WaitingListCreationAttributes
> {
  @AllowNull(false)
  @Unique('email')
  @Column(DataType.STRING)
  email!: WaitingListAttributes['email'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice: WaitingListAttributes['createdByDevice'];
}
