import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Category from './Category';
import DocumentAudit from './DocumentAudit';

@Table
export default class DocumentAuditCategory extends Model {
  @ForeignKey(() => DocumentAudit)
  @Column
  documentAuditId!: number;

  @ForeignKey(() => Category)
  @Column
  categoryId!: number;
}
