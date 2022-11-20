import express from 'express';
import { isAdmin, passportJwtAuth } from '../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import handlePagination from '../../../middlewares/handlePagination';
import { validateConfirm } from '../../../middlewares/validators/admin';
import { validateUpdateCollectionByUser } from '../../../middlewares/validators/wiki/collection';
import {
  getConfirmedCollectionsController,
  getUnconfirmedCollectionsController,
  postConfirmedCollectionController,
  updateConfirmedCollectionController,
} from '../../../services/admin';
import {
  getCollectionByUserController,
  updateCollectionByUserController,
} from '../../../services/wiki/collection';

const adminRouter = express.Router();

adminRouter.use(passportJwtAuth, isAdmin);

// get unconfirmed collections to admin page
adminRouter
  .route('/collection/unconfirmed')
  .get(getUnconfirmedCollectionsController)
  .post(validateConfirm, handleBadRequest, postConfirmedCollectionController);

// get confirmed collections to admin page
adminRouter
  .route('/collection/confirmed')
  .get(getConfirmedCollectionsController)
  .patch(
    validateConfirm,
    handleBadRequest,
    updateConfirmedCollectionController
  );

// confirm collection's channel info
// adminRouter
//   .route('/confirm')
//   .post(validateConfirm, handleBadRequest, postConfirmedCollectionController);

// get collections made by users not by marketplaceno
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
