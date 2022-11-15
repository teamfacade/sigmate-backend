import express from 'express';
import { isAdmin, passportJwtAuth } from '../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import handlePagination from '../../../middlewares/handlePagination';
import { validateConfirm } from '../../../middlewares/validators/admin';
import { validateUpdateCollectionByUser } from '../../../middlewares/validators/wiki/collection';
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
  .post(validateConfirm, handleBadRequest, postConfirmedCollectionController);

adminRouter
  .route('/info-confirm')
  .get(handlePagination, getCollectionByUserController);

adminRouter
  .route('/info-confirm/:slug')
  .patch(
    validateUpdateCollectionByUser,
    handleBadRequest,
    updateCollectionByUserController
  );

export default adminRouter;
