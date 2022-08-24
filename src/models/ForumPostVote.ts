import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import ForumPost from './ForumPost';
import User from './User';
import UserDevice from './UserDevice';

export interface ForumPostVoteAttributes {
  id: number;
  post: ForumPost;
  like: boolean;
  createdBy: User;
  createdByDevice: UserDevice;
}

export type ForumPostVoteCreationAttributes = Optional<
  ForumPostVoteAttributes,
  'id'
>;

@Table({
  modelName: 'ForumPostVote',
  tableName: 'forum_post_votes',
  timestamps: true,
  underscored: true,
  paranoid: false,
})
export default class ForumPostVote extends Model<
  ForumPostVoteAttributes,
  ForumPostVoteCreationAttributes
> {
  @AllowNull(false)
  @BelongsTo(() => ForumPost)
  post!: ForumPostVoteAttributes['post'];

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  like!: ForumPostVoteAttributes['like']; // true: upvote (+1), false: downvote (-1)

  @AllowNull(false)
  @BelongsTo(() => User)
  createdBy!: ForumPostVoteAttributes['createdBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice)
  createdByDevice!: ForumPostVoteAttributes['createdByDevice'];
}
