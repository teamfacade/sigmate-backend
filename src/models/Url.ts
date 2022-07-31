import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  HasMany,
  Index,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block from './Block';
import User from './User';
import UserDevice from './UserDevice';

export interface UrlAttributes {
  id: number;
  src: string;
  domain: string;
  title?: string;
  description?: string;
  favicon?: string;
  thumbnail?: string; // meta-image from og tags
  isAlive: boolean;
  blocks?: Block[];
  creatorDevice: UserDevice;
  creator: User;
}

export type UrlCreationAttributes = Optional<UrlAttributes, 'id' | 'domain'>;

@Table({
  tableName: 'urls',
  modelName: 'Url',
  timestamps: true,
  paranoid: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Url extends Model<UrlAttributes, UrlCreationAttributes> {
  @AllowNull(false)
  @Column(DataType.STRING(1024))
  src!: UrlAttributes['src'];

  @AllowNull(false)
  @Index('domain')
  @Column(DataType.STRING(191))
  domain!: UrlAttributes['domain'];

  @Column(DataType.STRING(255))
  title: UrlAttributes['title'];

  @Column(DataType.TEXT)
  description: UrlAttributes['description'];

  @Column(DataType.STRING(512))
  favicon: UrlAttributes['favicon'];

  @Column(DataType.STRING(512))
  thumbnail: UrlAttributes['thumbnail'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isAlive!: UrlAttributes['isAlive'];

  @HasMany(() => Block)
  blocks: UrlAttributes['blocks'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice, 'creatorDeviceId')
  creatorDevice!: UrlAttributes['creatorDevice'];

  @BelongsTo(() => User, 'creatorId')
  creator!: UrlAttributes['creator'];
}
