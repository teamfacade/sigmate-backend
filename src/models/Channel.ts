import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection, { CollectionAttributes } from './Collection';

export interface ChannelAttributes {
  id: number;
  collectionId?: CollectionAttributes['id'];
  collection?: Collection;
  name?: string;
  discordChannel: string;
  twitterChannel: string;
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
  @BelongsTo(() => Collection, { foreignKey: 'collectionId' })
  collection: ChannelAttributes['collection'];
  @Column(DataType.STRING(150))
  name: ChannelAttributes['name'];
  @Column(DataType.STRING(150))
  discordChannel!: string;
  @Column(DataType.STRING(150))
  twitterChannel!: string;
}
