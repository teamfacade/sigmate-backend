import express from 'express';
import { passportJwtAuth } from '../../../middlewares/authMiddlewares';
import imageUploader from '../../../middlewares/imageUploader';
import { createImageController } from '../../../services/image';

const testRouter = express.Router();

testRouter.post(
  '/',
  imageUploader.single('image'),
  passportJwtAuth,
  createImageController
);

export default testRouter;
