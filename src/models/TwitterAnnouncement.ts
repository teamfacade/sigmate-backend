import {
  AllowNull,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

export interface TwitterAnnouncementAttributes {
  id: number;
  project_name: string;
  twitter_account: string;
  content: string;
  contentId: string;
  timestamp?: string;
}

export type TwitterAnnouncementCreationAttributes = Optional<
  TwitterAnnouncementAttributes,
  'id'
>;

@Table({
  tableName: 'twitter_announcements',
  modelName: 'TwitterAnnouncement',
  underscored: true,
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class TwitterAnnouncement extends Model<
  TwitterAnnouncementAttributes,
  TwitterAnnouncementCreationAttributes
> {
  @Column(DataType.STRING(150))
  project_name!: TwitterAnnouncementAttributes['project_name'];

  @Column(DataType.STRING(64))
  twitter_account!: TwitterAnnouncementAttributes['twitter_account'];

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: TwitterAnnouncementAttributes['content'];

  @Column(DataType.STRING(64))
  contentId!: TwitterAnnouncementAttributes['contentId'];

  @Column(DataType.STRING(64))
  timestamp: TwitterAnnouncementAttributes['timestamp'];
}
