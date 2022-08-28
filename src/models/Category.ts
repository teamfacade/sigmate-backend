import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Document from './Document';
import DocumentAudit from './DocumentAudit';
import DocumentAuditCategory from './DocumentAuditCategory';
import DocumentCategory from './DocumentCategory';
import ForumPost from './ForumPost';
import ForumPostCategory from './ForumPostCategory';
import Image from './Image';
import User from './User';
import UserDevice from './UserDevice';

export interface CategoryAttributes {
  id: number;
  name: string;
  description?: string;
  parent?: Category; // fk
  children?: Category[];
  template?: Document; // fk. if set, enforce this template to all documents
  thumbnail?: Image; // img src url
  createdByDevice: UserDevice; // fk
  createdBy?: User; // fk
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

  @BelongsTo(() => Image, 'thumbnailId')
  thumbnail: CategoryAttributes['thumbnail'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: CategoryAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy: CategoryAttributes['createdBy'];

  @BelongsToMany(() => Document, () => DocumentCategory)
  documents: CategoryAttributes['documents'];

  @BelongsToMany(() => DocumentAudit, () => DocumentAuditCategory)
  documentAudits: CategoryAttributes['documentAudits'];

  @BelongsToMany(() => ForumPost, () => ForumPostCategory)
  forumPosts: CategoryAttributes['forumPosts'];
}
