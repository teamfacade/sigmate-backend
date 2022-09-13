import express from 'express';
import imageUploader from '../../../config/multerConfig';

const testRouter = express.Router();

testRouter.post(
  '/',
  imageUploader.array('images', 5),
  async (req, res, next) => {
    try {
      const files = req.files as Array<any>;
      for (const file of files) {
        console.log((<{ location: string }>file).location);
      }
      res.status(200).json({ result: 'ok' });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

export default testRouter;
