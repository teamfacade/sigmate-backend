import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import FileService from '.';
import { ImageFile } from '../../models/ImageFile.model';
import { ActionArgs, ActionMethod } from '../../utils/action';
import { s3Service } from '../s3';
import RequestError from '../../errors/request';
import { DateTime } from 'luxon';

type StorageEngineOptions = {
  path: string;
};

export default class ImageFileService extends FileService {
  private static LIMIT_IMG: multer.Options['limits'] = {
    files: 16,
    fields: 128,
    fieldSize: 2048,
    fieldNameSize: 64,
    fileSize: 32 * this.MB,
    parts: 8192,
  };

  public static PATH_WIKI_BLOCK_IMAGE =
    this.BASEPATH_PUBLIC + '/wiki/block/images';

  constructor() {
    super('ImageFile');
  }

  async start() {
    this.setStatus('AVAILABLE');
  }

  @ActionMethod('FILE/IMAGE/GET_METADATA')
  public async getImageMetadata(args: { filepath: string } & ActionArgs) {
    const { filepath, transaction } = args;
    const basename = this.getBasename(filepath);
    const path = filepath.slice(0, -1 * basename.length - 1);
    return await ImageFile.findOne({ where: { path, basename }, transaction });
  }

  @ActionMethod('FILE/IMAGE/HANDLE_UPLOAD')
  public async handleUpload(
    args: { file?: Express.Multer.File; path?: string } & ActionArgs
  ) {
    const { req, transaction } = args;
    const file = args.file as Express.MulterS3.File;
    if (!file) throw new Error('Uploaded file not found');

    const filepath = file.filename || file.key;

    const basename = this.getBasename(filepath);
    const path =
      this.storage === FileService.STORAGE_DISK
        ? (args.path as string)
        : filepath.slice(0, -1 * basename.length - 1);

    const createdById = req?.user?.id || undefined;

    return await ImageFile.create(
      {
        storage: this.storage,
        path,
        basename,
        mimetype: file.mimetype,
        size: file.size,
        createdById,
      },
      { transaction }
    );
  }

  @ActionMethod('FILE/IMAGE/DELETE')
  public async delete(args: { filepath: string } & ActionArgs) {
    const { transaction, filepath, req } = args;

    if (this.storage === 'S3') {
      // Delete from S3
      await s3Service.deleteObject({
        bucket: FileService.BUCKET_S3,
        key: filepath,
      });
    } else {
      // Delete from disk
      const joinedPath = join(FileService.BASEPATH_DISK, filepath);
      if (existsSync(joinedPath)) rmSync(joinedPath);
    }

    const basename = this.getBasename(filepath);
    const path = filepath.slice(0, -1 * basename.length - 1);

    // Delete from our DB
    await ImageFile.update(
      {
        deletedAt: DateTime.now().toJSDate(),
        deletedById: req?.user?.id,
      },
      { where: { basename, path }, transaction }
    );
  }

  public createImageMulter(options: StorageEngineOptions) {
    const { path } = options;
    let storage: multer.StorageEngine;
    if (this.storage === FileService.STORAGE_S3) {
      storage = multerS3({
        s3: s3Service.client,
        bucket: process.env.AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
          const filename = this.getUUIDFilename(file.originalname);
          cb(null, `${path}/${filename}`);
        },
      });
    } else {
      storage = multer.diskStorage({
        destination: join(FileService.BASEPATH_DISK, options.path),
        filename: (req, file, cb) => {
          const filename = this.getUUIDFilename(file.originalname);
          cb(null, filename);
        },
      });
    }

    return multer({
      storage,
      limits: ImageFileService.LIMIT_IMG,
      fileFilter: (req, file, cb) => {
        const mimetype = file.mimetype;
        const isValidMimeType = FileService.MIME_IMG.has(mimetype);
        if (!isValidMimeType) {
          return cb(new RequestError('REQ/IV_MIMETYPE'));
        }
        const ext = this.getFileExtension(file.originalname);
        // All image files should have a file extension in its filename
        if (!ext) {
          return cb(new RequestError('REQ/NF_IMG_FILE_EXT'));
        }
        const IMAGE_EXT = FileService.MIME_EXT_IMG;
        if (mimetype in IMAGE_EXT) {
          // Found file extension must match the MIME type
          const expectedExt = IMAGE_EXT[mimetype as keyof typeof IMAGE_EXT];
          if (ext !== expectedExt) {
            return cb(
              new RequestError('REQ/RJ_IMG_MIMETYPE_FILE_EXT_MISMATCH')
            );
          }
        }
        cb(null, true);
      },
    });
  }

  private getUUIDFilename(originalname: string) {
    return `${uuidv4()}.${this.getFileExtension(originalname)}`;
  }
}

export const imageService = new ImageFileService();
