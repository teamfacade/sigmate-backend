import multer from 'multer';
import multerS3 from 'multer-s3';
import s3 from './s3Config';

const imageUploader = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME as string,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, file.originalname);
    },
    acl: 'public-read-write',
  }),
});

export default imageUploader;
