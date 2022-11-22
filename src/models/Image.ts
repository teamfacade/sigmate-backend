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
import Category from './Category';
import ForumPost from './ForumPost';
import ForumPostImage from './ForumPostImage';
import User, { UserAttributes, UserPublicResponse } from './User';
import UserDevice, { UserDeviceAttributes } from './UserDevice';
import UserProfile from './UserProfile';

export interface ImageAttributes {
  id: string; // UUID (also the filename in our servers) v4
  folder: string;
  originalFilesize: number; // size in bytes
  caption?: string; // also used as alt attribute in img tag //necce
  md5?: string; // md5 hash of image file. duplication prevention
  createdByDeviceId?: UserDeviceAttributes['id'];
  createdByDevice?: UserDevice;
  createdById?: UserAttributes['id'];
  createdBy?: User;
  deletedByDeviceId?: UserDeviceAttributes['id'];
  deletedByDevice?: UserDevice;
  deletedById?: UserAttributes['id'];
  deletedBy?: User;

  blocks?: Block[]; // wiki
  forumPosts?: ForumPost;
  profiles?: UserProfile[];
  thumbnailCategories?: Category[]; // categories that use this image as the thumbnail
}

export type ImageCreateRequestBody = Pick<
  ImageAttributes,
  'id' | 'folder' | 'originalFilesize'
>;

export type ImageCreationDTO = ImageCreateRequestBody &
  Pick<
    ImageAttributes,
    'createdBy' | 'createdById' | 'createdByDeviceId' | 'createdByDevice'
  >;

export type ImageCreationAttributes = Optional<
  ImageAttributes,
  'id' | 'caption' | 'md5'
>;

export interface ImageResponse {
  url: string;
  createdBy?: UserPublicResponse;
}

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

  @AllowNull(false)
  @Column(DataType.STRING(64))
  folder!: ImageAttributes['folder'];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  originalFilesize!: ImageAttributes['originalFilesize'];

  @Column(DataType.STRING(191))
  caption: ImageAttributes['caption'];

  @Column(DataType.STRING(32))
  md5: ImageAttributes['md5'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: ImageAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: ImageAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice!: ImageAttributes['deletedByDevice'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy!: ImageAttributes['deletedBy'];

  @HasMany(() => Block, 'imageId')
  blocks: ImageAttributes['blocks'];

  @BelongsToMany(() => ForumPost, () => ForumPostImage)
  forumPosts: ImageAttributes['forumPosts'];

  @HasMany(() => UserProfile, 'profileImageId')
  profiles: ImageAttributes['profiles'];

  @HasMany(() => Category, 'thumbnailId')
  thumbnailCategories: ImageAttributes['thumbnailCategories'];

  async toResponseJSON(): Promise<ImageResponse> {
    const url: string =
      process.env.AWS_S3_IMAGE_BASEURL + this.folder + '/' + this.id;
    const createdBy = this.createdBy || (await this.$get('createdBy'));
    const createdByJSON = await createdBy?.toResponseJSONPublic();

    return {
      url,
      createdBy: createdByJSON,
    };
  }
}
