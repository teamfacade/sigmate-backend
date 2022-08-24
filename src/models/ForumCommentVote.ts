import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import ForumComment from './ForumComment';
import User from './User';
import UserDevice from './UserDevice';

export interface ForumCommentVoteAttributes {
  id: number;
  comment: ForumComment;
  like: boolean;
  createdBy: User;
  createdByDevice: UserDevice;
}

export type ForumCommentVoteCreationAttributes = Optional<
  ForumCommentVoteAttributes,
  'id'
>;

@Table({
  modelName: 'ForumCommentVote',
  tableName: 'forum_comment_vote',
  timestamps: true,
  underscored: true,
  paranoid: false,
})
export default class ForumCommentVote extends Model<
  ForumCommentVoteAttributes,
  ForumCommentVoteCreationAttributes
> {
  @BelongsTo(() => ForumComment)
  comment!: ForumCommentVoteAttributes['comment'];

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  like!: ForumCommentVoteAttributes['like'];

  @AllowNull(false)
  @BelongsTo(() => User)
  createdBy!: ForumCommentVoteAttributes['createdBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice)
  createdByDevice!: ForumCommentVoteAttributes['createdByDevice'];
}
