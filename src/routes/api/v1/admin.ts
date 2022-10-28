import express from 'express';
import { passportJwtAuth } from '../../../middlewares/authMiddlewares';
import {
  getUnconfirmedCollectionsController,
  postConfirmedCollectionController,
} from '../../../services/admin';

const adminRouter = express.Router();

adminRouter
  .route('/c')
  .get(passportJwtAuth, getUnconfirmedCollectionsController);

adminRouter
  .route('/confirm')
  .post(passportJwtAuth, postConfirmedCollectionController);
export default adminRouter;
