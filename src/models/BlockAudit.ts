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
import { DocumentAttributes } from './Document';
import DocumentAudit, { DocumentAuditAttributes } from './DocumentAudit';
import User, { UserAttributes } from './User';
import UserDevice, { UserDeviceAttributes } from './UserDevice';

export interface BlockAuditAttributes {
  id: number;
  action: 'c' | 'u' | 'd'; // create, update, delete
  block?: Block;
  blockId?: BlockAttributes['id'];

  // Multiple block audits can be a part of one document audit
  documentAuditId?: DocumentAuditAttributes['id'];
  documentAudit?: DocumentAudit;

  // Attributes that we keep track of
  element?: string;
  style?: { [key: string]: string };
  textContent?: string;
  structure?: BlockAttributes['id'][];
  parentId?: BlockAttributes['id'];
  documentId?: DocumentAttributes['id'];

  // Pointer to the last audit of each field
  // if it was not audited on this version
  // -- for quick reconstruction of versions
  lastElementAuditId?: BlockAuditAttributes['id'];
  lastElementAudit?: BlockAudit;
  lastStyleAuditId?: BlockAuditAttributes['id'];
  lastStyleAudit?: BlockAudit;
  lastTextContentAuditId?: BlockAuditAttributes['id'];
  lastTextContentAudit?: BlockAudit;
  lastStructureAuditId?: BlockAuditAttributes['id'];
  lastStructureAudit?: BlockAudit;
  lastParentAuditId?: BlockAuditAttributes['id'];
  lastParentAudit?: BlockAudit;

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

  @BelongsTo(() => DocumentAudit, {
    as: 'documentAudit',
    foreignKey: 'documentAuditId',
  })
  documentAudit: BlockAuditAttributes['documentAudit'];

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

  @Column(DataType.INTEGER)
  documentId: BlockAuditAttributes['documentId'];

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
