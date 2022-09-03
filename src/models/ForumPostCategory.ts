import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Category from './Category';
import ForumPost from './ForumPost';

@Table
export default class ForumPostCategory extends Model {
  @ForeignKey(() => ForumPost)
  @Column
  forumPostId!: number;

  @ForeignKey(() => Category)
  @Column
  categoryId!: number;
}
