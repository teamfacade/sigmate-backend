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
import User, { UserPublicResponse } from './User';
import UserDevice from './UserDevice';

export interface ForumPostVoteAttributes {
  id: number;
  post?: ForumPost;
  like: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: User;
  createdByDevice?: UserDevice;
  deletedBy?: User;
  deletedByDevice?: UserDevice;
}

export type ForumPostVoteCreationAttributes = Optional<
  ForumPostVoteAttributes,
  'id' | 'createdAt'
>;

export interface ForumPostVoteResponse
  extends Pick<ForumPostVoteAttributes, 'id' | 'like'> {
  createdBy: UserPublicResponse;
  createdAt: Date;
}

@Table({
  modelName: 'ForumPostVote',
  tableName: 'forum_post_votes',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export default class ForumPostVote extends Model<
  ForumPostVoteAttributes,
  ForumPostVoteCreationAttributes
> {
  @BelongsTo(() => ForumPost, 'forumPostId')
  post: ForumPostVoteAttributes['post'];

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  like!: ForumPostVoteAttributes['like']; // true: upvote (+1), false: downvote (-1)

  @BelongsTo(() => User, { as: 'createdBy', foreignKey: 'createdById' })
  createdBy: ForumPostVoteAttributes['createdBy'];

  @BelongsTo(() => UserDevice, {
    as: 'createdByDevice',
    foreignKey: 'createdByDeviceId',
  })
  createdByDevice: ForumPostVoteAttributes['createdByDevice'];

  @BelongsTo(() => User, { as: 'deletedBy', foreignKey: 'deletedById' })
  deletedBy: ForumPostVoteAttributes['deletedBy'];

  @BelongsTo(() => UserDevice, {
    as: 'deletedByDevice',
    foreignKey: 'deletedByDeviceId',
  })
  deletedByDevice: ForumPostVoteAttributes['deletedByDevice'];
}
