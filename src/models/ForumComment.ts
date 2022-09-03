import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import ForumCommentVote from './ForumCommentVote';
import ForumPost from './ForumPost';
import ForumReport from './ForumReport';
import User from './User';
import UserDevice from './UserDevice';

export interface ForumCommentAttributes {
  id: number;
  content: string;
  createdBy: User;
  createdByDevice: UserDevice;
  deletedBy: User;
  deletedByDevice: UserDevice;
  votes: ForumCommentVote[];
  post: ForumPost;
  parent?: ForumComment;
  replies?: ForumComment[];
  reports?: ForumReport[];
}

export type ForumCommentCreationAttributes = Optional<
  ForumCommentAttributes,
  'id'
>;

@Table({
  modelName: 'ForumComment',
  tableName: 'forum_comment',
  underscored: true,
  timestamps: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class ForumComment extends Model<
  ForumCommentAttributes,
  ForumCommentCreationAttributes
> {
  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: ForumCommentAttributes['content'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: ForumCommentAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: ForumCommentAttributes['createdByDevice'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy!: ForumCommentAttributes['deletedBy'];

  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice!: ForumCommentAttributes['deletedByDevice'];

  @HasMany(() => ForumCommentVote, 'forumCommentId')
  votes!: ForumCommentAttributes['votes'];

  @BelongsTo(() => ForumPost, 'forumPostId')
  post!: ForumCommentAttributes['post'];

  @BelongsTo(() => ForumComment, 'parentId')
  parent: ForumCommentAttributes['parent'];

  @HasMany(() => ForumComment, 'parentId')
  replies: ForumCommentAttributes['replies'];

  @HasMany(() => ForumReport, 'forumCommentId')
  reports: ForumCommentAttributes['reports'];
}
