import { Column, DataType, Model, Table } from 'sequelize-typescript';
import Block from './Block';
import User from './User';

export type DocumentEditIdType = number;

export interface DocumentEditAttributes {
  id: DocumentEditIdType;
  type: string; // C: create, U: update, D: delete
  diff: string;
  document: Document; // not null
  block: Block; // if empty, a document-level edit. if not empty, a block-level edit
  approvedBy: User;
  approvedAt: Date;
  createdAt: Date;
  revertedAt: Date;
  revertedBy: Date;
}

@Table({
  tableName: 'document_edits',
  modelName: 'DocumentEdit',
  timestamps: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class DocumentEdit extends Model<DocumentEditAttributes> {
  @Column(DataType.STRING(1))
  get type() {
    switch (this.getDataValue('type')) {
      case 'C':
        return 'create';
      case 'U':
        return 'update';
      case 'D':
        return 'delete';
      default:
        return 'other';
    }
  }
  set type(value) {
    switch (value) {
      case 'create':
        this.setDataValue('type', 'C');
        break;
      case 'update':
        this.setDataValue('type', 'U');
        break;
      case 'delete':
        this.setDataValue('type', 'D');
        break;
      default:
        this.setDataValue('type', 'other');
        break;
    }
  }
}
