import {
  AllowNull,
  Column,
  DataType,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

export interface ChannelAttributes {
  id: number;
  project_name: string;
  discord_channel?: string;
  twitter_account?: string;
}

export type ChannelCreationAttributes = Optional<ChannelAttributes, 'id'>;

@Table({
  tableName: 'channel_types',
  modelName: 'ChannelType',
  underscored: true,
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Channel extends Model<
  ChannelAttributes,
  ChannelCreationAttributes
> {
  @Unique('dicord_channel')
  @AllowNull(false)
  @Column(DataType.STRING(64))
  project_name!: ChannelAttributes['project_name'];

  @Unique('dicord_channel')
  @AllowNull(true)
  @Column(DataType.STRING(64))
  discord_channel: ChannelAttributes['discord_channel'];

  @Unique('discord_channel')
  @AllowNull(true)
  @Column(DataType.STRING(64))
  twitter_account: ChannelAttributes['twitter_account'];
}
