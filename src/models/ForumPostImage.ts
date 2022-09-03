import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import ForumPost from './ForumPost';
import Image from './Image';

@Table
export default class ForumPostImage extends Model {
  @ForeignKey(() => ForumPost)
  @Column
  forumPostId!: number;

  @ForeignKey(() => Image)
  @Column
  imageId!: number;
}
