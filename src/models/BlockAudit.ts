import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Table,
  Model,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block from './Block';
import Image from './Image';
import Url from './Url';
import User from './User';
import UserDevice from './UserDevice';

export interface BlockAuditAttributes {
  id: number;
  block: Block;
  element?: string;
  style?: string;
  textContent?: string;
  image?: Image;
  url?: Url;
  structure?: string;
  parent?: Block;
  children?: Block[];
  createdByDevice?: UserDevice;
  createdBy?: User;
  approvedByDevice?: UserDevice;
  approvedBy?: User;
  approvedAt?: Date;
  revertedByDevice?: UserDevice;
  revertedBy?: User;
  revertedAt?: Date;
}

export type BlockAuditCreationAttributes = Optional<BlockAuditAttributes, 'id'>;

@Table({
  tableName: 'block_audits',
  modelName: 'BlockAudit',
  timestamps: true,
  paranoid: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class BlockAudit extends Model<
  BlockAuditAttributes,
  BlockAuditCreationAttributes
> {
  @BelongsTo(() => Block, 'blockId')
  block!: BlockAuditAttributes['block'];

  @AllowNull(false)
  @Column(DataType.TEXT)
  element!: BlockAuditAttributes['element'];

  @Column(DataType.TEXT)
  style!: BlockAuditAttributes['style'];

  @Column(DataType.TEXT)
  textContent!: BlockAuditAttributes['textContent'];

  @BelongsTo(() => Image, 'imageId')
  image!: BlockAuditAttributes['image'];

  @BelongsTo(() => Url, 'urlId')
  url!: BlockAuditAttributes['url'];

  @Column(DataType.TEXT)
  structure!: BlockAuditAttributes['structure'];

  @BelongsTo(() => Block, 'parentId')
  parent: BlockAuditAttributes['parent'];

  @HasMany(() => Block, 'parentId')
  children: BlockAuditAttributes['children'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: BlockAuditAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: BlockAuditAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'approvedByDeviceId')
  approvedByDevice: BlockAuditAttributes['approvedByDevice'];

  @BelongsTo(() => User, 'approvedById')
  approvedBy: BlockAuditAttributes['approvedBy'];

  @Column(DataType.DATE)
  approvedAt: BlockAuditAttributes['approvedAt'];

  @BelongsTo(() => UserDevice, 'revertedByDeviceId')
  revertedByDevice: BlockAuditAttributes['revertedByDevice'];

  @BelongsTo(() => User, 'revertedById')
  revertedBy: BlockAuditAttributes['revertedBy'];

  @Column(DataType.DATE)
  revertedAt: BlockAuditAttributes['revertedAt'];
}
