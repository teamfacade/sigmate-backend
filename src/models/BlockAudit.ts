import {
  BelongsTo,
  Column,
  DataType,
  Table,
  Model,
  AllowNull,
  Default,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block, { BlockAttributes } from './Block';
import User, { UserAttributes } from './User';
import UserDevice, { UserDeviceAttributes } from './UserDevice';

export interface BlockAuditAttributes {
  id: number;
  action: 'c' | 'u' | 'd'; // create, update, delete
  block?: Block;
  blockId?: BlockAttributes['id'];
  element?: string;
  style?: { [key: string]: string };
  textContent?: string;
  structure?: number[];
  parentId?: number;
  createdByDeviceId?: UserDeviceAttributes['id'];
  createdByDevice?: UserDevice;
  createdById?: UserAttributes['id'];
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
  approvedByDeviceId?: UserDeviceAttributes['id'];
  approvedByDevice?: UserDevice;
  approvedById?: UserAttributes['id'];
  approvedBy?: User;
  approvedAt?: Date;
  revertedByDevice?: UserDevice;
  revertedBy?: User;
  revertedAt?: Date;
}

export type BlockAuditCreationAttributes = Optional<
  BlockAuditAttributes,
  'id' | 'action' | 'createdAt' | 'updatedAt'
>;

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
  @Default('u')
  @AllowNull(false)
  @Column(DataType.STRING(1))
  action!: BlockAuditAttributes['action'];

  @BelongsTo(() => Block, 'blockId')
  block: BlockAuditAttributes['block'];

  @Column(DataType.STRING(16))
  element: BlockAuditAttributes['element'];

  @Column(DataType.JSON)
  style: BlockAuditAttributes['style'];

  @Column(DataType.TEXT)
  textContent: BlockAuditAttributes['textContent'];

  @Column(DataType.JSON)
  structure: BlockAuditAttributes['structure'];

  @Column(DataType.INTEGER)
  parentId: BlockAuditAttributes['parentId'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice: BlockAuditAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy: BlockAuditAttributes['createdBy'];

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
