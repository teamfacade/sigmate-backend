import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Document, { DocumentAttributes } from './Document';
import Category from './Category';
import User, { UserAttributes } from './User';
import UserDevice, { UserDeviceAttributes } from './UserDevice';
import DocumentAuditCategory from './DocumentAuditCategory';
import BlockAudit from './BlockAudit';
import { BlockAttributes } from './Block';

export interface DocumentAuditAttributes {
  id: number;
  documentId?: DocumentAttributes['id'];
  document?: Document;
  title?: string;
  structure?: BlockAttributes['id'][];
  parentId?: DocumentAttributes['id']; // Not an association
  categories?: Category[];
  blockAudits?: BlockAudit[];

  createdByDeviceId?: UserDeviceAttributes['id'];
  createdByDevice?: UserDevice;
  createdById?: UserAttributes['id'];
  createdBy?: User;
  approvedByDeviceId?: UserDeviceAttributes['id'];
  approvedByDevice?: UserDevice;
  approvedById?: UserAttributes['id'];
  approvedBy?: User;
  approvedAt?: Date;
  revertedByDevice?: UserDevice;
  revertedBy?: User;
  revertedAt?: Date;
}

// Store the updated columns only and leave others null
export type DocumentAuditCreationAttributes = Optional<
  DocumentAuditAttributes,
  'id'
>;

@Table({
  tableName: 'document_audits',
  modelName: 'DocumentAudit',
  underscored: true,
  timestamps: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class DocumentAudit extends Model<
  DocumentAuditAttributes,
  DocumentAuditCreationAttributes
> {
  @BelongsTo(() => Document, 'documentId')
  document: DocumentAuditAttributes['document'];

  @Column(DataType.STRING(191))
  title: DocumentAuditAttributes['title'];

  @Column(DataType.JSON)
  structure: DocumentAuditAttributes['structure'];

  @Column(DataType.INTEGER)
  parentId: DocumentAuditAttributes['parentId'];

  @BelongsToMany(() => Category, () => DocumentAuditCategory)
  categories: DocumentAuditAttributes['categories'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: DocumentAuditAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy: DocumentAuditAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'approvedByDeviceId')
  approvedByDevice!: DocumentAuditAttributes['approvedByDevice'];

  @BelongsTo(() => User, 'approvedById')
  approvedBy: DocumentAuditAttributes['approvedBy'];

  @Column(DataType.DATE)
  approvedAt: DocumentAuditAttributes['approvedAt'];

  @BelongsTo(() => UserDevice, 'revertedByDeviceId')
  revertedByDevice: DocumentAuditAttributes['revertedByDevice'];

  @BelongsTo(() => User, 'revertedById')
  revertedBy: DocumentAuditAttributes['revertedBy'];

  @Column(DataType.DATE)
  revertedAt: DocumentAuditAttributes['revertedAt'];
}
