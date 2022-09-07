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
import User, { UserPublicResponse } from './User';
import UserDevice from './UserDevice';

export interface ForumCommentAttributes {
  id: number;
  content: string;
  createdBy?: User;
  createdByDevice?: UserDevice;
  deletedBy?: User;
  deletedByDevice?: UserDevice;
  votes?: ForumCommentVote[];
  post?: ForumPost;
  parentId?: number;
  parent?: ForumComment;
  replies?: ForumComment[];
  reports?: ForumReport[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type ForumCommentCreationAttributes = Optional<
  ForumCommentAttributes,
  'id'
>;

export type ForumCommentCreationDTO = Pick<
  ForumCommentCreationAttributes,
  'content' | 'parentId'
>;

export interface ForumCommentResponse
  extends Pick<
    ForumCommentAttributes,
    'id' | 'content' | 'createdAt' | 'updatedAt'
  > {
  voteCount: number;
  replyCount: number;
  parent?: ForumCommentResponse;
  replies?: ForumCommentResponse[];
  parentId?: ForumCommentAttributes['id'];
  createdBy?: UserPublicResponse;
}

export type ForumCommentCreateRequest = Pick<
  ForumCommentAttributes,
  'content' | 'parentId'
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
  @Column(DataType.STRING)
  content!: ForumCommentAttributes['content'];

  @BelongsTo(() => User, { as: 'createdBy', foreignKey: 'createdById' })
  createdBy: ForumCommentAttributes['createdBy'];

  @BelongsTo(() => UserDevice, {
    as: 'createdByDevice',
    foreignKey: 'createdByDeviceId',
  })
  createdByDevice: ForumCommentAttributes['createdByDevice'];

  @BelongsTo(() => User, { as: 'deletedBy', foreignKey: 'deletedById' })
  deletedBy: ForumCommentAttributes['deletedBy'];

  @BelongsTo(() => UserDevice, {
    as: 'deletedByDevice',
    foreignKey: 'deletedByDeviceId',
  })
  deletedByDevice: ForumCommentAttributes['deletedByDevice'];

  @HasMany(() => ForumCommentVote, 'forumCommentId')
  votes: ForumCommentAttributes['votes'];

  @BelongsTo(() => ForumPost, 'forumPostId')
  post: ForumCommentAttributes['post'];

  @BelongsTo(() => ForumComment, { as: 'parent', foreignKey: 'parentId' })
  parent: ForumCommentAttributes['parent'];

  @HasMany(() => ForumComment, { as: 'replies', foreignKey: 'parentId' })
  replies: ForumCommentAttributes['replies'];

  @HasMany(() => ForumReport, 'forumCommentId')
  reports: ForumCommentAttributes['reports'];
}
