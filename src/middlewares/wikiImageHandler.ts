import multer from 'multer';
import multerS3 from 'multer-s3';
import s3 from '../config/s3Config';
import { v4 as uuidv4 } from 'uuid';
import isIn from 'validator/lib/isIn';
import BadRequestError from '../utils/errors/BadRequestError';

const MB = 1024 * 1024;
const IMAGE_MIME_TYPES = [
  'image/gif',
  'image/bmp',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tiff',
];

const createWikiImageHandler = (dirpath: string) =>
  multer({
    storage: multerS3({
      s3,
      bucket: process.env.AWS_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const filename = uuidv4();
        const filepath = `wiki/${dirpath}/${filename}`;
        cb(null, filepath);
      },
      acl: 'public-read',
    }),
    limits: { fileSize: 32 * MB, fields: 2048, files: 512 },
    fileFilter: (req, file, cb) => {
      const isValidMimeType = isIn(file.mimetype, IMAGE_MIME_TYPES);
      if (!isValidMimeType) {
        cb(
          new BadRequestError({
            validationErrors: [
              {
                location: 'body',
                param: 'image',
                msg: 'INVALID_MIME_TYPE',
                value: file.mimetype,
              },
            ],
          })
        );
        return;
      }
      cb(null, true);
    },
  });

export const wikiBlockImageHandler = createWikiImageHandler('block');
