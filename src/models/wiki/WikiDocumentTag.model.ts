import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { WikiTag, WikiTagAttribs } from './WikiTag.model';
import {
  WikiDocumentRel,
  WikiDocumentRelAttribs,
} from './WikiDocumentRel.model';

@Table({
  modelName: 'WikiDocumentTag',
  tableName: 'wiki_document_tags',
  timestamps: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class WikiDocumentTag extends Model {
  @ForeignKey(() => WikiDocumentRel)
  @Column
  documentId!: WikiDocumentRelAttribs['id'];

  @ForeignKey(() => WikiTag)
  @Column
  tagId!: WikiTagAttribs['id'];
}
