import {
  AllowNull,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

export interface DiscordAnnouncementAttributes {
  id: number;
  project_name: string;
  discord_channel: string;
  content: string;
  contentId: string;
  timestamp?: string;
}

export type DiscordAnnouncementCreationAttributes = Optional<
  DiscordAnnouncementAttributes,
  'id'
>;

@Table({
  tableName: 'discord_announcements',
  modelName: 'DiscordAnnouncement',
  underscored: true,
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class DiscordAnnouncement extends Model<
  DiscordAnnouncementAttributes,
  DiscordAnnouncementCreationAttributes
> {
  @Column(DataType.STRING(150))
  project_name!: DiscordAnnouncementAttributes['project_name'];

  @Column(DataType.STRING(64))
  discord_channel!: DiscordAnnouncementAttributes['discord_channel'];

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: DiscordAnnouncementAttributes['content'];

  @Column(DataType.STRING(64))
  contentId!: DiscordAnnouncementAttributes['contentId'];

  @Column(DataType.STRING(64))
  timestamp: DiscordAnnouncementAttributes['timestamp'];
}
