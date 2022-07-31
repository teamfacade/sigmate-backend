import {
  AllowNull,
  Column,
  DataType,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

export type DocumentIdType = number;
export const documentIdDataTypes = DataType.INTEGER;

export interface DocumentAttributes {
  id: DocumentIdType;
  title: string;
  isTemplate: boolean;
  textContent?: string; // text content of all the blocks in a document
  initStructure?: JSON; // JSON
  currentStructure?: JSON;
  template?: Document;
  parent?: Document;
}

export type DocumentCreationAttributes = Optional<
  DocumentAttributes,
  'id' | 'isTemplate'
>;

@Table({
  tableName: 'documents',
  modelName: 'Document',
  timestamps: true,
  paranoid: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Document extends Model<
  DocumentAttributes,
  DocumentCreationAttributes
> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  title!: DocumentAttributes['title'];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isTemplate!: DocumentAttributes['isTemplate'];

  @Column(DataType.TEXT)
  textContent?: DocumentAttributes['textContent'];

  @Column(DataType.JSON)
  initStructure?: DocumentAttributes['initStructure'];

  @Column(DataType.JSON)
  currentStructure?: DocumentAttributes['currentStructure'];

  @HasOne(() => Document, 'templateId')
  template?: DocumentAttributes['template'];

  @HasOne(() => Document, 'parentId')
  parent?: DocumentAttributes['parent'];
}
