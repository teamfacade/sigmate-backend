import {
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection from './Collection';
import DiscordAnnouncement from './DiscordAnnouncement';
import TwitterAnnouncement from './TwitterAnnouncement';

export interface ChannelAttributes {
  id: number;
  projectName: Collection;
  discordChannel: string;
  twitterChannel: string;
  discordAnnouncement?: DiscordAnnouncement[];
  twitterAnnouncement?: TwitterAnnouncement[];
}

export type ChannelCreationAttributes = Optional<ChannelAttributes, 'id'>;

@Table({
  tableName: 'channels',
  modelName: 'Channel',
  timestamps: true,
  paranoid: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Channel extends Model<
  ChannelAttributes,
  ChannelCreationAttributes
> {
  @BelongsTo(() => Collection, 'name')
  projectName!: ChannelAttributes['projectName'];

  @Column(DataType.STRING(150))
  discordChannel!: string;

  @Column(DataType.STRING(150))
  twitterChannel!: string;

  @HasMany(() => DiscordAnnouncement, 'name')
  discordAnnouncement: ChannelAttributes['discordAnnouncement'];

  @HasMany(() => TwitterAnnouncement, 'name')
  twitterdAnnouncement: ChannelAttributes['twitterAnnouncement'];
}
