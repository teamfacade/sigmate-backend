import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';
export interface DiscordAnnouncementAttributes {
  id: number;
  collectionId?: number;
  collection?: Collection;
  discordChannel: string;
  contentId: string;
  content: string;
  timestamp: string;
}
export type DiscordAnnouncementCreationAttributes = Optional<
  DiscordAnnouncementAttributes,
  'id'
>;

export type DiscordAnnoucemenetResponse = {
  opt: 'd';
  content: string;
  timestamp: string;
  content_id: number;
};
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
  @BelongsTo(() => Collection, { foreignKey: 'collectionId' })
  collection: DiscordAnnouncementAttributes['collection'];

  @Column(DataType.STRING(150))
  discordChannel!: string;

  @Column(DataType.STRING(150))
  contentId!: string;

  @Column(DataType.TEXT)
  content!: string;

  @Column(DataType.STRING(150))
  timestamp!: string;
}
