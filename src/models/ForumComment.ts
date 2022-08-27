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

  @AllowNull(false)
  @BelongsTo(() => User, 'createdById')
  createdBy!: ForumCommentAttributes['createdBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: ForumCommentAttributes['createdByDevice'];

  @AllowNull(false)
  @BelongsTo(() => User, 'deletedById')
  deletedBy!: ForumCommentAttributes['deletedBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice!: ForumCommentAttributes['deletedByDevice'];

  @HasMany(() => ForumCommentVote)
  votes!: ForumCommentAttributes['votes'];

  @BelongsTo(() => ForumPost)
  post!: ForumCommentAttributes['post'];

  @BelongsTo(() => ForumComment)
  parent: ForumCommentAttributes['parent'];

  @HasMany(() => ForumComment)
  replies: ForumCommentAttributes['replies'];
}
