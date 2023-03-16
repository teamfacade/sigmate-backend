import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  Default,
  AllowNull,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { UserId, User } from './User.model';

export type ImageFileId = number;
interface ImageFileAttribs {
  id: ImageFileId;
  /** Storage medium: `S3` */
  storage: string;
  /** Folder path except basename */
  path: string;
  /** Filename */
  basename: string;
  /** Mimetype to use for the file */
  mimetype: string;
  /** File size in bytes */
  size: number;

  /** User who uploaded the image */
  createdBy?: User;
  createdById?: UserId;
  createdAt: Date;

  deletedBy?: User;
  deletedById?: UserId;
  deletedAt?: Date;

  /** (VIRTUAL) Static url for the image in S3 */
  url: string;
}

type ImageFileCAttribs = Optional<
  Omit<ImageFileAttribs, 'url'>,
  'id' | 'createdAt'
>;

export const SIZE_ORIGINAL_FILENAME = 255;

/**
 * File information of images stored in AWS S3
 */
@Table({
  modelName: 'ImageFile',
  tableName: 'image_files',
  timestamps: false,
  underscored: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class ImageFile extends Model<ImageFileAttribs, ImageFileCAttribs> {
  static FIND_ATTRIBS: Record<string, (keyof ImageFileAttribs)[]> = {
    default: ['id', 'path', 'url'],
  };
  @Default('S3')
  @AllowNull(false)
  @Column(DataType.STRING(8))
  storage!: ImageFileAttribs['storage'];

  @AllowNull(false)
  @Column(DataType.STRING)
  path!: ImageFileAttribs['path'];

  @AllowNull(false)
  @Column(DataType.STRING)
  basename!: ImageFileAttribs['basename'];

  @AllowNull(false)
  @Column(DataType.STRING(32))
  mimetype!: ImageFileAttribs['mimetype'];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  size!: ImageFileAttribs['size'];

  @BelongsTo(() => User, { foreignKey: 'createdById', as: 'createdBy' })
  createdBy: ImageFileAttribs['createdBy'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: ImageFileAttribs['createdAt'];

  @BelongsTo(() => User, { foreignKey: 'deletedById', as: 'deletedBy' })
  deletedBy: ImageFileAttribs['deletedBy'];

  @Column(DataType.DATE)
  deletedAt: ImageFileAttribs['deletedAt'];

  @Column(DataType.VIRTUAL)
  get url() {
    return `/static/uploads/${this.path}/${this.basename}`;
  }
  set url(value) {
    throw new Error('Cannot set read-only virtual column "url"');
  }
}
