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
import User, { UserPublicResponse } from './User';
import UserDevice from './UserDevice';

export interface ForumCommentVoteAttributes {
  id: number;
  comment?: ForumComment;
  like: boolean;
  createdBy?: User;
  createdByDevice?: UserDevice;
  deletedBy?: User;
  deletedByDevice?: UserDevice;
}

export type ForumCommentVoteCreationAttributes = Optional<
  ForumCommentVoteAttributes,
  'id'
>;

export interface ForumCommentVoteResponse
  extends Pick<ForumCommentVoteAttributes, 'id' | 'like'> {
  createdBy: UserPublicResponse;
  createdAt: Date;
}

@Table({
  modelName: 'ForumCommentVote',
  tableName: 'forum_comment_votes',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export default class ForumCommentVote extends Model<
  ForumCommentVoteAttributes,
  ForumCommentVoteCreationAttributes
> {
  @BelongsTo(() => ForumComment, 'forumCommentId')
  comment: ForumCommentVoteAttributes['comment'];

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  like!: ForumCommentVoteAttributes['like'];

  @BelongsTo(() => User, 'createdById')
  createdBy: ForumCommentVoteAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice: ForumCommentVoteAttributes['createdByDevice'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy: ForumCommentVoteAttributes['deletedBy'];

  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice: ForumCommentVoteAttributes['deletedByDevice'];
}
