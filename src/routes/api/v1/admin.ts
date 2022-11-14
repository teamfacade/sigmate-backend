import express from 'express';
import { isAdmin, passportJwtAuth } from '../../../middlewares/authMiddlewares';
import handlePagination from '../../../middlewares/handlePagination';
import { validateConfirm } from '../../../middlewares/validators/admin';
import {
  getUnconfirmedCollectionsController,
  postConfirmedCollectionController,
} from '../../../services/admin';
import {
  getCollectionByUserController,
  updateCollectionByUserController,
} from '../../../services/wiki/collection';

const adminRouter = express.Router();

adminRouter.use(passportJwtAuth, isAdmin);

adminRouter.route('/uc').get(getUnconfirmedCollectionsController);

adminRouter
  .route('/confirm')
  .post(validateConfirm, postConfirmedCollectionController);

adminRouter
  .route('/info-confirm')
  .get(handlePagination, getCollectionByUserController);

adminRouter
  .route('/info-confirm/:slug')
  .patch(updateCollectionByUserController);

export default adminRouter;
