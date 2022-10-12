import express from 'express';
import { passportJwtAuth } from '../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import imageUploader from '../../../middlewares/imageUploader';
import { validateCreateImage } from '../../../middlewares/validators/image';
import { createImageController } from '../../../services/image';

const imageRouter = express.Router();

imageRouter
  .route('/upload')
  .post(
    validateCreateImage,
    handleBadRequest,
    imageUploader.single('image'),
    passportJwtAuth,
    createImageController
  );

export default imageRouter;
