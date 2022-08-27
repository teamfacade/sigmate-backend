import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import NestedArray from '../types/NestedArray';
import Block, { BlockIdType } from './Block';
import Document from './Document';
import Category from './Category';
import User from './User';
import UserDevice from './UserDevice';

export interface DocumentAuditAttributes {
  id: number;
  document: Document;
  title?: string;
  structure?: string;
  template?: Document;
  parent?: Document;
  blocks?: Block[];
  categories?: Category[];
  createdByDevice: UserDevice;
  createdBy?: User;
  approvedByDevice?: UserDevice;
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
  document!: DocumentAuditAttributes['document'];

  @Column(DataType.STRING(191))
  title!: DocumentAuditAttributes['title'];

  @Column(DataType.TEXT)
  get structure() {
    const stringified = this.getDataValue('structure');
    if (!stringified) return [];
    return JSON.parse(stringified);
  }
  set structure(value: NestedArray<BlockIdType>) {
    try {
      this.setDataValue('structure', JSON.stringify(value));
    } catch (error) {
      console.error(error);
      throw new Error('ERR_MODEL_DOCUMENT_SET_STRUCTURE');
    }
  }

  @HasOne(() => Document, 'templateId')
  template: DocumentAuditAttributes['template'];

  @BelongsTo(() => Document, 'auditParentId')
  parent: DocumentAuditAttributes['parent'];

  @HasMany(() => Block)
  blocks: DocumentAuditAttributes['blocks'];

  @BelongsToMany(() => Category, 'categoryDocumentAudits')
  categories: DocumentAuditAttributes['categories'];

  @AllowNull(false)
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
