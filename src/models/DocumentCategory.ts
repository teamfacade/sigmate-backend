import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Category from './Category';
import Document from './Document';

@Table
export default class DocumentCategory extends Model {
  @ForeignKey(() => Document)
  @Column
  documentId!: number;

  @ForeignKey(() => Category)
  @Column
  categoryId!: number;
}
