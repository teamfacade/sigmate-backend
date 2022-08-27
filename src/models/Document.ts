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
import DocumentAudit from './DocumentAudit';
import Category from './Category';
import User from './User';
import UserDevice from './UserDevice';

export type DocumentIdType = number;
export const documentIdDataTypes = DataType.INTEGER;

export interface DocumentAttributes {
  id: DocumentIdType;
  title: string;
  isTemplate: boolean;
  textContent?: string; // text content of all the blocks in a document
  structure?: string;
  template?: Document;
  parent?: Document;
  children?: Document[];
  blocks?: Block[];
  categories?: Category[];
  audits?: DocumentAudit[];
  createdByDevice: UserDevice;
  createdBy: User;
  updatedByDevice?: UserDevice;
  updatedBy?: User;
  deletedByDevice?: UserDevice;
  deletedBy?: User;
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
  template?: DocumentAttributes['template'];

  @BelongsTo(() => Document, 'parentId')
  parent: DocumentAttributes['parent'];

  // Not used. Used for association with DocumentAudit model
  @HasMany(() => DocumentAudit, 'auditParentId')
  auditParent!: DocumentAttributes['parent'];

  @HasMany(() => Document, 'parentId')
  children?: DocumentAttributes['children'];

  @HasMany(() => Block)
  blocks: DocumentAttributes['blocks'];

  @BelongsToMany(() => Category, 'categoryDocuments')
  categories: DocumentAttributes['categories'];

  @HasMany(() => DocumentAudit)
  audits: DocumentAttributes['audits'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: DocumentAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: DocumentAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'updatedByDeviceId')
  updatedByDevice: DocumentAttributes['updatedByDevice'];

  @BelongsTo(() => User, 'updatedById')
  updatedBy: DocumentAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice: DocumentAttributes['deletedByDevice'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy: DocumentAttributes['deletedBy'];
}
