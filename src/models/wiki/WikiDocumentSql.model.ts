import {
  Model,
  Table,
  Column,
  DataType,
  PrimaryKey,
  BelongsToMany,
} from 'sequelize-typescript';
import { WikiTag } from './WikiTag.model';
import WikiDocumentTag from './WikiDocumentTag.model';

export interface WikiDocumentSqlAttribs {
  id: sigmate.Wiki.DocumentId;
  tags?: WikiTag[];
}

@Table({
  modelName: 'WikiDocumentSql',
  tableName: 'wiki_documents',
  timestamps: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class WikiDocumentSql extends Model {
  @PrimaryKey
  @Column(DataType.STRING(32))
  id!: WikiDocumentSqlAttribs['id'];

  @BelongsToMany(() => WikiTag, {
    through: () => WikiDocumentTag,
    as: 'tags',
    foreignKey: 'tagId',
    otherKey: 'documentId',
  })
  tags: WikiDocumentSqlAttribs['tags'];
}
