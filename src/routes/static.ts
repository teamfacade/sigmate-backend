import express from 'express';
import ImageController from '../controllers/file/image';

const staticRouter = express.Router();

staticRouter.get('/uploads/*', ImageController.getImage);

export default staticRouter;
