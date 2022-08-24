import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  Model,
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
  'id'
>;

export default class ForumPostView extends Model<
  ForumPostViewAttributes,
  ForumPostViewCreationAttributes
> {
  @BelongsTo(() => ForumPost)
  post!: ForumPostViewAttributes['post'];

  @BelongsTo(() => User)
  viewedBy!: ForumPostViewAttributes['viewedBy'];

  @BelongsTo(() => UserDevice)
  viewedByDevice!: ForumPostViewAttributes['viewedByDevice'];

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: ForumPostViewAttributes['createdAt'];
}
