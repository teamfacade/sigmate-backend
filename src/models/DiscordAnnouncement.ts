import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Channel from './Channel';

export interface DiscordAnnouncementAttributes {
  id: number;
  project: Channel;
  contentId: string;
  content: string;
  timestamp: string;
}

export type DiscordAnnouncementCreationAttributes = Optional<
  DiscordAnnouncementAttributes,
  'id'
>;

@Table({
  tableName: 'discord_announcements',
  modelName: 'DiscordAnnouncement',
  timestamps: true,
  paranoid: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class DiscordAnnouncement extends Model<
  DiscordAnnouncementAttributes,
  DiscordAnnouncementCreationAttributes
> {
  @BelongsTo(() => Channel, 'name')
  project!: DiscordAnnouncementAttributes['project'];

  @Column(DataType.STRING(150))
  contentId!: string;

  @Column(DataType.TEXT)
  content!: string;

  @Column(DataType.STRING(150))
  timestamp!: string;
}
