import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block from './Block';
import BlockAudit from './BlockAudit';
import Category from './Category';
import ForumPost from './ForumPost';
import ForumPostImage from './ForumPostImage';
import User from './User';
import UserDevice from './UserDevice';
import UserProfile from './UserProfile';

export interface ImageAttributes {
  id: string; // UUID (also the filename in our servers)
  originalFilename: string; // user-provided (sanitize!)
  originalFilesize: number; // size in bytes
  caption?: string; // also used as alt attribute in img tag //necce
  mimetype: string; // HTTP mimetype header
  md5: string; // md5 hash of image file. duplication prevention
  blocks?: Block[]; // all necce
  blockAudits?: BlockAudit[];
  createdByDevice: UserDevice;
  createdBy?: User;
  forumPosts?: ForumPost;
  profiles?: UserProfile[];
  thumbnailCategories?: Category[]; // categories that use this image as the thumbnail
}

export type ImageCreationAttributes = Optional<
  ImageAttributes,
  'id' | 'caption' | 'originalFilename' | 'md5'
>;

@Table({
  tableName: 'images',
  modelName: 'Image',
  timestamps: true,
  paranoid: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Image extends Model<
  ImageAttributes,
  ImageCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: ImageAttributes['id'];

  @Column(DataType.STRING(191))
  originalFilename!: ImageAttributes['originalFilename'];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  originalFilesize!: ImageAttributes['originalFilesize'];

  @Column(DataType.STRING(191))
  caption: ImageAttributes['caption'];

  @AllowNull(false)
  @Column(DataType.STRING(191))
  mimetype!: ImageAttributes['mimetype'];

  @Column(DataType.STRING(32))
  md5!: ImageAttributes['md5'];

  @HasMany(() => Block, 'imageId')
  blocks: ImageAttributes['blocks'];

  @HasMany(() => BlockAudit, 'imageId')
  blockAudits: ImageAttributes['blockAudits'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: ImageAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: ImageAttributes['createdBy'];

  @BelongsToMany(() => ForumPost, () => ForumPostImage)
  forumPosts: ImageAttributes['forumPosts'];

  @HasMany(() => UserProfile, 'profileImageId')
  profiles: ImageAttributes['profiles'];

  @HasMany(() => Category, 'thumbnailId')
  thumbnailCategories: ImageAttributes['thumbnailCategories'];
}
