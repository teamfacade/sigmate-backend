import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import ForumPost from './ForumPost';
import User from './User';
import UserDevice from './UserDevice';

export interface ForumPostViewAttributes {
  id: number;
  post: ForumPost;
  viewedBy?: User;
  viewedByDevice: UserDevice;
  createdAt: Date;
}

export type ForumPostViewCreationAttributes = Optional<
  ForumPostViewAttributes,
  'id' | 'createdAt'
>;

@Table({
  tableName: 'forum_post_views',
  modelName: 'ForumPostView',
  timestamps: false,
  underscored: true,
})
export default class ForumPostView extends Model<
  ForumPostViewAttributes,
  ForumPostViewCreationAttributes
> {
  @BelongsTo(() => ForumPost, 'forumPostId')
  post!: ForumPostViewAttributes['post'];

  @BelongsTo(() => User, 'viewedById')
  viewedBy!: ForumPostViewAttributes['viewedBy'];

  @BelongsTo(() => UserDevice, 'viewedByDeviceId')
  viewedByDevice!: ForumPostViewAttributes['viewedByDevice'];

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: ForumPostViewAttributes['createdAt'];
}
