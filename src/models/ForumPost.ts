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
import ForumPostCategory from './ForumPostCategory';
import ForumPostImage from './ForumPostImage';
import ForumPostTag from './ForumPostTag';
import ForumPostView from './ForumPostView';
import ForumPostVote from './ForumPostVote';
import ForumReport from './ForumReport';
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
  reports?: ForumReport[];
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

  @BelongsTo(() => User, 'createdById')
  createdBy!: ForumPostAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: ForumPostAttributes['createdByDevice'];

  @BelongsTo(() => User, 'updatedById')
  updatedBy: ForumPostAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, 'updatedByDeviceId')
  updatedByDevice: ForumPostAttributes['updatedByDevice'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy: ForumPostAttributes['deletedBy'];

  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice: ForumPostAttributes['deletedByDevice'];

  @HasMany(() => ForumPostView, 'forumPostId')
  views: ForumPostAttributes['views'];

  @HasMany(() => ForumPostVote, 'forumPostId')
  votes: ForumPostAttributes['votes'];

  @HasMany(() => ForumComment, 'forumPostId')
  comments: ForumPostAttributes['comments'];

  @HasMany(() => ForumReport, 'forumPostId')
  reports: ForumPostAttributes['reports'];

  @BelongsToMany(() => Category, () => ForumPostCategory)
  categories!: ForumPostAttributes['categories'];

  @BelongsToMany(() => ForumTag, () => ForumPostTag)
  tags: ForumPostAttributes['tags'];

  @Column(DataType.DATE)
  contentUpdatedAt: ForumPostAttributes['contentUpdatedAt'];

  @BelongsToMany(() => Image, () => ForumPostImage)
  images: ForumPostAttributes['images'];
}
