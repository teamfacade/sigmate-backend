import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import ForumPost from './ForumPost';
import User from './User';

export interface ForumTagAttributes {
  id: number;
  name: string;
  createdBy: User;
  posts?: ForumPost[];
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

  @AllowNull(false)
  @BelongsTo(() => User)
  createdBy!: ForumTagAttributes['createdBy'];

  @BelongsToMany(() => ForumPost, 'forumPostTags')
  posts: ForumTagAttributes['posts'];
}
