import express from 'express';
import { passportJwtAuth } from '../../../middlewares/authMiddlewares';
import { validateConfirm } from '../../../middlewares/validators/admin';
import {
  getUnconfirmedCollectionsController,
  postConfirmedCollectionController,
} from '../../../services/admin';

const adminRouter = express.Router();

adminRouter
  .route('/uc')
  .get(passportJwtAuth, getUnconfirmedCollectionsController);

adminRouter
  .route('/confirm')
  .post(passportJwtAuth, validateConfirm, postConfirmedCollectionController);
  
export default adminRouter;
