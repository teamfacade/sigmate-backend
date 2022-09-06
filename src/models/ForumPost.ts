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
import Category, { CategoryAttributes } from './Category';
import ForumComment from './ForumComment';
import ForumPostCategory from './ForumPostCategory';
import ForumPostImage from './ForumPostImage';
import ForumPostTag from './ForumPostTag';
import ForumPostView from './ForumPostView';
import ForumPostVote, { ForumPostVoteResponse } from './ForumPostVote';
import ForumReport from './ForumReport';
import ForumTag, { ForumTagAttributes } from './ForumTag';
import Image from './Image';
import User, { UserPublicResponse } from './User';
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
  categories?: Category[];
  tags?: ForumTag[];
  images?: Image[];
  contentUpdatedAt?: Date;
}

export type ForumPostCreationAttributes = Optional<
  ForumPostAttributes,
  'id' | 'createdBy' | 'createdByDevice' | 'categories'
>;

export interface ForumPostCreateRequestBody
  extends Pick<ForumPostAttributes, 'title' | 'content'> {
  categories: CategoryAttributes['id'][];
  tags: ForumTagAttributes['name'][];
}

export type ForumPostUpdateRequestBody = Partial<ForumPostCreateRequestBody>;

export type ForumPostDTO = ForumPostUpdateRequestBody &
  Pick<ForumPostAttributes, 'id' | 'contentUpdatedAt'>;

export type ForumPostCreationDTO = ForumPostCreateRequestBody &
  Pick<ForumPostAttributes, 'createdBy' | 'createdByDevice'>;

export interface ForumPostResponse
  extends Pick<
    ForumPostAttributes,
    | 'id'
    | 'title'
    | 'content'
    | 'views'
    | 'votes'
    | 'comments'
    | 'categories'
    | 'tags'
    | 'contentUpdatedAt'
  > {
  viewCount?: number;
  voteCount?: number;
  commentCount?: number;
  myVote?: ForumPostVoteResponse | null;
  createdBy: UserPublicResponse;
  updatedBy: UserPublicResponse;
}

@Table({
  tableName: 'forum_posts',
  modelName: 'ForumPost',
  timestamps: true,
  paranoid: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class ForumPost extends Model<
  ForumPostAttributes,
  ForumPostCreationAttributes
> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  title!: ForumPostAttributes['title'];

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: ForumPostAttributes['content'];

  @BelongsTo(() => User, { as: 'createdBy', foreignKey: 'createdById' })
  createdBy!: ForumPostAttributes['createdBy'];

  @BelongsTo(() => UserDevice, {
    as: 'createdByDevice',
    foreignKey: 'createdByDeviceId',
  })
  createdByDevice!: ForumPostAttributes['createdByDevice'];

  @BelongsTo(() => User, { as: 'updatedBy', foreignKey: 'updatedById' })
  updatedBy: ForumPostAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, {
    as: 'updatedByDevice',
    foreignKey: 'updatedByDeviceId',
  })
  updatedByDevice: ForumPostAttributes['updatedByDevice'];

  @BelongsTo(() => User, { as: 'deletedBy', foreignKey: 'deletedById' })
  deletedBy: ForumPostAttributes['deletedBy'];

  @BelongsTo(() => UserDevice, {
    as: 'deletedByDevice',
    foreignKey: 'deletedByDeviceId',
  })
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
  categories: ForumPostAttributes['categories'];

  @BelongsToMany(() => ForumTag, () => ForumPostTag)
  tags: ForumPostAttributes['tags'];

  @Column(DataType.DATE)
  contentUpdatedAt: ForumPostAttributes['contentUpdatedAt'];

  @BelongsToMany(() => Image, () => ForumPostImage)
  images: ForumPostAttributes['images'];
}
