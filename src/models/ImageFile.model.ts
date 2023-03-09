import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  Default,
  AllowNull,
  PrimaryKey,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User, { UserId } from './User.model';

export type ImageFileId = string;
interface ImageFileAttribs {
  /** Filename (uuid v4) */
  id: ImageFileId;
  /** Folder path except basename */
  path: string;
  /** MD5 hash of file. Nulled on file is deleted from S3. */
  md5: string;
  /** (VIRTUAL) Static url for the image in S3 */
  url: string;
  createdBy?: User;
  createdById?: UserId;
  createdAt: Date;
}

type ImageFileCAttribs = Optional<Omit<ImageFileAttribs, 'url'>, 'createdAt'>;

/**
 * File information of images stored in AWS S3
 */
@Table({
  modelName: 'ImageFile',
  tableName: 'image_files',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class ImageFile extends Model<
  ImageFileAttribs,
  ImageFileCAttribs
> {
  static FIND_ATTRIBS: Record<string, (keyof ImageFileAttribs)[]> = {
    default: ['id', 'path', 'url'],
  };

  @PrimaryKey
  @Column(DataType.STRING(36))
  id!: ImageFileAttribs['id'];

  @AllowNull(false)
  @Column(DataType.STRING)
  path!: ImageFileAttribs['path'];

  @Unique
  @Column(DataType.STRING(32))
  md5!: ImageFileAttribs['md5'];

  @BelongsTo(() => User, { foreignKey: 'createdById' })
  createdBy: ImageFileAttribs['createdBy'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: ImageFileAttribs['createdAt'];

  @Column(DataType.VIRTUAL)
  get url() {
    return process.env.AWS_S3_IMAGE_BASEURL + '/' + this.path + '/' + this.id;
  }
  set url(value) {
    throw new Error('Cannot set read-only virtual column "url"');
  }
}
