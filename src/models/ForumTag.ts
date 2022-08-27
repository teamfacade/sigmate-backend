import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
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

export interface ForumTagAttributes {
  id: number;
  name: string;
  posts?: ForumPost[];
  isBanned: boolean;
  createdBy: User;
  createdByDevice: UserDevice;
}

export type ForumTagCreationAttributes = Optional<ForumTagAttributes, 'id'>;

@Table({
  tableName: 'forum_tags',
  modelName: 'ForumTag',
  timestamps: true,
  paranoid: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class ForumTag extends Model<
  ForumTagAttributes,
  ForumTagCreationAttributes
> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: ForumTagAttributes['name'];

  @BelongsToMany(() => ForumPost, 'forumPostTags')
  posts: ForumTagAttributes['posts'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isBanned!: ForumTagAttributes['isBanned'];

  @AllowNull(false)
  @BelongsTo(() => User)
  createdBy!: ForumTagAttributes['createdBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice)
  createdByDevice!: ForumTagAttributes['createdByDevice'];
}
