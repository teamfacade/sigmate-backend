import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Channel from './Channel';

export interface DiscordAccountAttributes {
  id: number;
  account: string;
  channels?: Channel[];
}

export type DiscordAccountCreationAttributes = Optional<
  DiscordAccountAttributes,
  'id'
>;

@Table({
  tableName: 'discord_accounts',
  modelName: 'DiscordAccount',
  timestamps: true,
  paranoid: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class DiscordAccount extends Model<
  DiscordAccountAttributes,
  DiscordAccountCreationAttributes
> {
  @Column(DataType.STRING(150))
  account!: string;
  @HasMany(() => Channel, 'discordAccountId')
  channels: DiscordAccountAttributes['channels'];
}
