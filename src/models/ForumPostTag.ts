import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import ForumPost from './ForumPost';
import ForumTag from './ForumTag';

@Table({
  underscored: true,
})
export default class ForumPostTag extends Model {
  @ForeignKey(() => ForumPost)
  @Column
  forumPostId!: number;

  @ForeignKey(() => ForumTag)
  @Column
  forumTagId!: number;
}
