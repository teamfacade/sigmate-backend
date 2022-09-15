import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';
export interface TwitterAnnouncementAttributes {
  id: number;
  collection: number;
  twitterChannel: string;
  contentId: string;
  content: string;
  timestamp: string;
}
export type TwitterAnnouncementCreationAttributes = Optional<
  TwitterAnnouncementAttributes,
  'id'
>;
@Table({
  tableName: 'twitter_announcements',
  modelName: 'TwitterAnnouncement',
  timestamps: true,
  paranoid: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class TwitterAnnouncement extends Model<
  TwitterAnnouncementAttributes,
  TwitterAnnouncementCreationAttributes
> {
  @BelongsTo(() => Collection, { foreignKey: 'collectionId' })
  collection!: TwitterAnnouncementAttributes['collection'];

  @Column(DataType.STRING(150))
  twitterChannel!: string;

  @Column(DataType.STRING(150))
  contentId!: string;

  @Column(DataType.TEXT)
  content!: string;

  @Column(DataType.STRING(150))
  timestamp!: string;
}
