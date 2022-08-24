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
import Document from './Document';
import DocumentAudit from './DocumentAudit';
import ForumPost from './ForumPost';
import Image from './Image';
import User from './User';
import UserDevice from './UserDevice';

export interface CategoryAttributes {
  id: number;
  name: string;
  description?: string;
  parent?: Category; // fk
  children?: Category;
  template?: Document; // fk. if set, enforce this template to all documents
  thumbnail?: Image; // img src url
  creatorDevice: UserDevice; // fk
  creator?: User; // fk
  documents?: Document[];
  documentAudits?: DocumentAudit[];
  forumPosts?: ForumPost[];
}

export type CategoryCreationAttributes = Optional<CategoryAttributes, 'id'>;

@Table({
  tableName: 'document_categories',
  modelName: 'Category',
  timestamps: true,
  paranoid: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Category extends Model<
  CategoryAttributes,
  CategoryCreationAttributes
> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: CategoryAttributes['name'];

  // displayed in category list in the forum
  @Column(DataType.STRING(191))
  description: CategoryAttributes['description'];

  @BelongsTo(() => Category, 'parentId')
  parent: CategoryAttributes['parent'];

  @HasMany(() => Category, 'parentId')
  children: CategoryAttributes['children'];

  @HasOne(() => Document)
  template: CategoryAttributes['template'];

  @HasOne(() => Image, 'thumbnailId')
  thumbnail: CategoryAttributes['thumbnail'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice)
  creatorDevice!: CategoryAttributes['creatorDevice'];

  @BelongsTo(() => User)
  creator: CategoryAttributes['creator'];

  @BelongsToMany(() => Document, 'categoryDocuments')
  documents: CategoryAttributes['documents'];

  @BelongsToMany(() => DocumentAudit, 'categoryDocumentAudits')
  documentAudits: CategoryAttributes['documentAudits'];

  @BelongsToMany(() => ForumPost, 'forumPostCategories')
  forumPosts: CategoryAttributes['forumPosts'];
}
