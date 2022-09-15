import express from 'express';
import imageUploader from '../../../config/multerConfig';

const testRouter = express.Router();

testRouter.post(
  '/test',
  imageUploader.single('image'),
  async (req, res, next) => {
    try {
      res.status(200).json({ result: 'ok' });
    } catch (error) {
      next(error);
    }
  }
);

export default testRouter;
