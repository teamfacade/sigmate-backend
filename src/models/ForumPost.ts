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
import Category from './Category';
import ForumComment from './ForumComment';
import ForumPostView from './ForumPostView';
import ForumPostVote from './ForumPostVote';
import ForumTag from './ForumTag';
import Image from './Image';
import User from './User';
import UserDevice from './UserDevice';

export interface ForumPostAttributes {
  id: number;
  title: string;
  content: string;
  createdBy: User;
  createdByDevice: UserDevice;
  updatedBy?: User;
  updatedByDevice?: UserDevice;
  deletedBy?: User;
  deletedByDevice?: UserDevice;
  views?: ForumPostView[];
  votes?: ForumPostVote[];
  comments?: ForumComment[];
  categories: Category[];
  tags?: ForumTag[];
  images?: Image[];
  contentUpdatedAt?: Date;
}

export type ForumPostCreationAttributes = Optional<ForumPostAttributes, 'id'>;

@Table({
  tableName: 'forum_posts',
  modelName: 'ForumPost',
  timestamps: true,
  paranoid: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class ForumPost extends Model<ForumPostAttributes> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  title!: ForumPostAttributes['title'];

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: ForumPostAttributes['content'];

  @AllowNull(false)
  @BelongsTo(() => User, 'createdById')
  createdBy!: ForumPostAttributes['createdBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: ForumPostAttributes['createdByDevice'];

  @AllowNull(false)
  @BelongsTo(() => User, 'updatedById')
  updatedBy: ForumPostAttributes['updatedBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice, 'updatedByDeviceId')
  updatedByDevice: ForumPostAttributes['updatedByDevice'];

  @AllowNull(false)
  @BelongsTo(() => User, 'deletedById')
  deletedBy: ForumPostAttributes['deletedBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice: ForumPostAttributes['deletedByDevice'];

  @HasMany(() => ForumPostView)
  views!: ForumPostAttributes['views'];

  @HasMany(() => ForumPostVote)
  votes!: ForumPostAttributes['votes'];

  @HasMany(() => ForumComment)
  comments: ForumPostAttributes['comments'];

  @BelongsToMany(() => Category, 'forumPostCategories')
  categories!: ForumPostAttributes['categories'];

  @BelongsToMany(() => ForumTag, 'forumPostTags')
  tags: ForumPostAttributes['tags'];

  @Column(DataType.DATE)
  contentUpdatedAt: ForumPostAttributes['contentUpdatedAt'];

  @BelongsToMany(() => Image, 'forumPostImages')
  images: ForumPostAttributes['images'];
}
