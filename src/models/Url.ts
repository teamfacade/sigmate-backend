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
import BlockAudit from './BlockAudit';
import UrlVerification from './UrlVerification';
import User from './User';
import UserDevice from './UserDevice';

export interface UrlAttributes {
  id: number;
  src: string;
  md5: string; // for indexing urls
  domain: string;
  title?: string;
  description?: string;
  favicon?: string;
  thumbnail?: string; // meta-image from og tags
  isBanned: boolean;
  blocks?: Block[];
  blockAudits?: BlockAudit[];
  urlVerifications: UrlVerification[];
  createdByDevice: UserDevice;
  createdBy: User;
}

export type UrlCreationAttributes = Optional<
  UrlAttributes,
  'id' | 'domain' | 'isBanned'
>;

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
  @Index('md5')
  @Column(DataType.STRING(32))
  md5!: UrlAttributes['md5'];

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

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isBanned!: UrlAttributes['isBanned'];

  @HasMany(() => Block, 'urlId')
  blocks: UrlAttributes['blocks'];

  @HasMany(() => BlockAudit, 'urlId')
  blockAudits: UrlAttributes['blockAudits'];

  @HasMany(() => UrlVerification, 'urlId')
  urlVerifications!: UrlAttributes['urlVerifications'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: UrlAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: UrlAttributes['createdBy'];
}
