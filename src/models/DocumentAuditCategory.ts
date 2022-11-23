import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Category from './Category';
import DocumentAudit from './DocumentAudit';

@Table({
  tableName: 'document_audit_categories',
  modelName: 'DocumentAuditCategory',
  timestamps: false,
  underscored: true,
})
export default class DocumentAuditCategory extends Model {
  @ForeignKey(() => DocumentAudit)
  @Column
  documentAuditId!: number;

  @ForeignKey(() => Category)
  @Column
  categoryId!: number;
}
