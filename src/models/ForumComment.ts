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
  author: User;
  authorDevice: UserDevice;
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
  @BelongsTo(() => User)
  author!: ForumCommentAttributes['author'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice)
  authorDevice!: ForumCommentAttributes['authorDevice'];

  @HasMany(() => ForumCommentVote)
  votes!: ForumCommentAttributes['votes'];

  @BelongsTo(() => ForumPost)
  post!: ForumCommentAttributes['post'];

  @BelongsTo(() => ForumComment)
  parent: ForumCommentAttributes['parent'];

  @HasMany(() => ForumComment)
  replies: ForumCommentAttributes['replies'];
}
