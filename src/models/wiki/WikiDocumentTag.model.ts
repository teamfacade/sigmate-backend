import { ForeignKey, Model, Table } from 'sequelize-typescript';
import { WikiTag, WikiTagAttribs } from './WikiTag.model';
import {
  WikiDocumentSql,
  WikiDocumentSqlAttribs,
} from './WikiDocumentSql.model';

@Table({
  modelName: 'WikiDocumentTag',
  tableName: 'wiki_document_tags',
  timestamps: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class WikiDocumentTag extends Model {
  @ForeignKey(() => WikiDocumentSql)
  documentId!: WikiDocumentSqlAttribs['id'];

  @ForeignKey(() => WikiTag)
  tagId!: WikiTagAttribs['id'];
}
