import express from 'express';
import {
  getUnconfirmedCollectionsController,
  postConfirmedCollectionController,
} from '../../../services/admin';

const adminRouter = express.Router();

adminRouter.route('/c').get(getUnconfirmedCollectionsController);

adminRouter.route('/confirm').post(postConfirmedCollectionController);
export default adminRouter;
