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
      const dir = req.body.folder;
      const newFileName = uuidv4();
      req.body.id = newFileName;
      const fullPath = `${dir}/` + newFileName;
      cb(null, fullPath);
    },
    acl: 'public-read-write',
  }),
  fileFilter: (req, file, cb) => {
    // Check whether or not to continue with upload

    // Check if folder name is valid
    const dir = req.body.folder;
    const isDirValid = isIn(dir, [
      'test',
      'profile',
      'category',
      'forum',
      'wiki',
    ]);
    if (isDirValid) {
      cb(null, isDirValid);
    } else {
      // Throw error for error handler to catch
      // Stops the upload and further middlewares and controllers
      cb(
        new BadRequestError({
          validationErrors: [
            {
              location: 'body',
              param: 'folder',
              value: dir,
              msg: 'INVALID_FOLDER_NAME',
            },
          ],
        })
      );
    }
  },
});

export default imageUploader;
