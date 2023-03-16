import express from 'express';
import WikiFileController from '../../../controllers/wiki/file';
import ImageUploader from '../../../middlewares/uploaders/image';

const wikiFileRouter = express.Router();

wikiFileRouter.post(
  '/block/image',
  ImageUploader.wikiBlock(),
  WikiFileController.uploadImageBlock
);

export default wikiFileRouter;
