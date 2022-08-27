import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';
import User from './User';
import UserDevice from './UserDevice';

export interface MintingScheduleAttributes {
  id: number;
  name: string;
  tier: number;
  mintingTime: Date;
  mintingUrl?: string;
  description?: string;
  collection: Collection;
  mintingPrice?: string;
  mintingPriceSymbol?: string; // ETH/KLAYTN/SOL/Matic
  createdBy: User;
  createdByDevice: UserDevice;
  updatedBy?: User;
  updatedByDevice?: UserDevice;
  savedUsers?: User[]; // "add to my calendar"
}

export type MintingScheduleCreationAttributes = Optional<
  MintingScheduleAttributes,
  'id'
>;

@Table({
  tableName: 'minting_schedules',
  modelName: 'MintingSchedule',
  timestamps: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class MintingSchedule extends Model<
  MintingScheduleAttributes,
  MintingScheduleCreationAttributes
> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: MintingScheduleAttributes['name'];

  @Default(1)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  tier!: MintingScheduleAttributes['tier'];

  @AllowNull(false)
  @Column(DataType.DATE)
  mintingTime!: MintingScheduleAttributes['mintingTime'];

  @Column(DataType.STRING(1024))
  mintingUrl: MintingScheduleAttributes['mintingUrl'];

  @Column(DataType.TEXT)
  description: MintingScheduleAttributes['description'];

  @AllowNull(false)
  @BelongsTo(() => Collection)
  collection!: MintingScheduleAttributes['collection'];

  @Column(DataType.STRING(191))
  mintingPrice: MintingScheduleAttributes['mintingPrice'];

  @Column(DataType.STRING(10))
  mintingPriceSymbol: MintingScheduleAttributes['mintingPriceSymbol'];

  @AllowNull(false)
  @BelongsTo(() => User, 'createdById')
  createdBy!: MintingScheduleAttributes['createdBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: MintingScheduleAttributes['createdByDevice'];

  @BelongsTo(() => User, 'updatedById')
  updatedBy: MintingScheduleAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, 'updatedByDeviceId')
  updatedByDevice: MintingScheduleAttributes['updatedByDevice'];

  @BelongsToMany(() => User, 'savedMintingSchedules')
  savedUsers: MintingScheduleAttributes['savedUsers'];
}
