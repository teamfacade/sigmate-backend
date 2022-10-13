import multer from 'multer';
import multerS3 from 'multer-s3';
import s3 from '../config/s3Config';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import isIn from 'validator/lib/isIn';
import BadRequestError from '../utils/errors/BadRequestError';
type FileNameCallback = (error: Error | null, filename: string) => void;

const imageUploader = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req: Request, file: Express.Multer.File, cb: FileNameCallback) => {
      const dir = req.query.folder;
      const newFileName = uuidv4();
      req.body.id = newFileName;
      const fullPath = `${dir}/` + newFileName;
      cb(null, fullPath);
    },
    acl: 'public-read',
  }),
  limits: { fileSize: 10485760 },
  fileFilter: (req, file, cb) => {
    const isValidType = isIn(file.mimetype, [
      'image/gif',
      'image/bmp',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
    ]);
    if (isValidType) {
      cb(null, true);
    } else {
      cb(new BadRequestError());
    }
  },
});

export default imageUploader;
