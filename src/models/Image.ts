import {
  AllowNull,
  BelongsTo,
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
import User from './User';
import UserDevice from './UserDevice';

export interface ImageAttributes {
  id: string; // UUID (also the filename in our servers)
  originalFilename: string; // user-provided (sanitize!)
  originalFilesize: number; // size in bytes
  caption?: string; // also used as alt attribute in img tag
  mimetype: string; // HTTP mimetype header
  processed: boolean; // whether post-processing is complete for this image
  md5: string; // md5 hash of image file. duplication prevention
  createdAt: Date;
  blocks?: Block[];
  creatorDevice: UserDevice;
  creator?: User;
}

export type ImageCreationAttributes = Optional<
  ImageAttributes,
  'id' | 'caption' | 'originalFilename' | 'md5'
>;

@Table({
  tableName: 'images',
  modelName: 'Image',
  timestamps: false,
  paranoid: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Image extends Model<
  ImageAttributes,
  ImageCreationAttributes
> {
  @AllowNull(false)
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

  @Column(DataType.BOOLEAN)
  processed!: ImageAttributes['processed'];

  @Column(DataType.STRING(32))
  md5!: ImageAttributes['md5'];

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: ImageAttributes['createdAt'];

  @HasMany(() => Block)
  blocks: ImageAttributes['blocks'];

  @BelongsTo(() => UserDevice)
  creatorDevice!: ImageAttributes['creatorDevice'];

  @BelongsTo(() => User)
  creator!: ImageAttributes['creator'];
}
