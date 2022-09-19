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
import Collection, {
  CollectionAttributes,
  CollectionResponse,
} from './Collection';
import User, { UserAttributes } from './User';
import UserDevice, { UserDeviceAttributes } from './UserDevice';
import UserSavedMintingSchedule from './UserSavedMintingSchedule';

export interface MintingScheduleAttributes {
  id: number;
  name: string;
  tier: number;
  mintingTime: Date;
  mintingUrl?: string;
  description?: string;
  collectionId?: CollectionAttributes['id'];
  collection?: Collection;
  mintingPrice?: string;
  mintingPriceSymbol?: string; // ETH/KLAYTN/SOL/Matic
  createdById?: UserAttributes['id'];
  createdBy?: User;
  createdByDeviceId?: UserDeviceAttributes['id'];
  createdByDevice?: UserDevice;
  updatedBy?: User;
  updatedByDevice?: UserDevice;
  savedUsers?: User[]; // "add to my calendar"
}

export type MintingScheduleCreationAttributes = Optional<
  MintingScheduleAttributes,
  'id'
>;

export type MintingScheduleResponseConcise = Pick<
  MintingScheduleAttributes,
  | 'id'
  | 'name'
  | 'tier'
  | 'mintingTime'
  | 'mintingUrl'
  | 'description'
  | 'mintingPrice'
  | 'mintingPriceSymbol'
>;

export interface MintingScheduleResponse
  extends MintingScheduleResponseConcise {
  collection?: CollectionResponse;
}
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

  @BelongsTo(() => Collection, 'collectionId')
  collection: MintingScheduleAttributes['collection'];

  @Column(DataType.STRING(191))
  mintingPrice: MintingScheduleAttributes['mintingPrice'];

  @Column(DataType.STRING(16))
  mintingPriceSymbol: MintingScheduleAttributes['mintingPriceSymbol'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: MintingScheduleAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: MintingScheduleAttributes['createdByDevice'];

  @BelongsTo(() => User, 'updatedById')
  updatedBy: MintingScheduleAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, 'updatedByDeviceId')
  updatedByDevice: MintingScheduleAttributes['updatedByDevice'];

  @BelongsToMany(() => User, () => UserSavedMintingSchedule)
  savedUsers: MintingScheduleAttributes['savedUsers'];

  toResponseJSONConcise(): MintingScheduleResponseConcise {
    return {
      id: this.id,
      name: this.name,
      tier: this.tier,
      mintingTime: this.mintingTime,
      description: this.description,
      mintingPrice: this.mintingPrice,
      mintingPriceSymbol: this.mintingPriceSymbol,
    };
  }

  async toResponseJSON() {
    const cl = this.collection || (await this.$get('collection'));
    const clr = await cl?.toResponseJSON();
    const response: MintingScheduleResponse = {
      ...this.toResponseJSONConcise(),
      collection: clr,
    };
    return response;
  }
}
