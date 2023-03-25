import { existsSync, mkdirSync } from 'node:fs';
import Service from '..';
import { checkEnv } from '../../utils';

export default class FileService extends Service {
  public static STORAGE_S3 = 'S3';
  public static STORAGE_DISK = 'disk';
  public static STORAGE_DEFAULT = this.STORAGE_DISK;

  public static BASEPATH_PUBLIC = 'public';
  public static BASEPATH_DISK = 'uploads';

  public static BASEURL_S3: string;
  public static BUCKET_S3: string;
  public static BASEURL_UPLOADS = '/static/uploads';

  public static MIME_EXT_IMG = Object.freeze({
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/tiff': 'tiff',
    'image/webp': 'webp',
  });
  public static MIME_IMG = new Set(Object.keys(this.MIME_EXT_IMG));
  public static EXT_IMG = new Set(Object.values(this.MIME_EXT_IMG));

  public static REGEX_EXT = /\.\w*$/;
  public static REGEX_BASENAME = /[^/]+\.\w+$/;

  protected static KB = 1024;
  protected static MB = this.KB * 1024;
  protected static GB = this.MB * 1024;

  storage: string;
  constructor(name?: string) {
    super(name || 'File');
    checkEnv(['FILE_STORAGE', 'AWS_BUCKET_NAME', 'AWS_REGION'], true);
    const storageOptions = new Set([
      FileService.STORAGE_S3,
      FileService.STORAGE_DISK,
    ]);
    if (storageOptions.has(process.env.FILE_STORAGE || '')) {
      this.storage = process.env.FILE_STORAGE as NonNullable<
        typeof process.env.FILE_STORAGE
      >;
    } else {
      this.storage = FileService.STORAGE_DEFAULT;
    }
    FileService.BUCKET_S3 = process.env.AWS_BUCKET_NAME;
    FileService.BASEURL_S3 = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
  }

  async start() {
    this.setStatus('STARTING');

    // For Multer DiskStorage, create a destination folder
    if (this.storage === FileService.STORAGE_DISK) {
      if (!existsSync(FileService.BASEPATH_DISK)) {
        mkdirSync(FileService.BASEPATH_DISK);
      }
    }

    this.setStatus('AVAILABLE', { message: `(Engine: ${this.storage})` });
  }

  protected getFileExtension(filename: string) {
    const extIdx = filename.search(FileService.REGEX_EXT);
    if (extIdx < 0) return '';
    return filename.slice(extIdx + 1).toLowerCase();
  }

  protected getBasename(filepath: string) {
    let basenameIdx = filepath.search(FileService.REGEX_BASENAME);
    if (basenameIdx < 0) basenameIdx = 0;
    return filepath.slice(basenameIdx);
  }

  protected getBasenameMinusExt(filepath: string) {
    const basename = this.getBasename(filepath);
    const extIdx = basename.search(FileService.REGEX_EXT);
    if (extIdx < 0) return basename;
    return basename.slice(0, extIdx);
  }
}

export const fileService = new FileService();
