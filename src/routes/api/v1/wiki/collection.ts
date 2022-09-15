import express from 'express';
import {
  passportJwtAuth,
  passportJwtAuthOptional,
} from '../../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import {
  validateCreateCollection,
  validateCreateCollectionCategory,
  validateCreateCollectionUtility,
  validateDeleteCollection,
  validateGetCollectionBySlug,
  validateGetCollectionCategories,
  validateGetCollectionUtilities,
  validateUpdateCollection,
  validateUpdateCollectionCategory,
} from '../../../../middlewares/validators/wiki/collection';
import {
  createCollectionCategoryController,
  createCollectionController,
  createCollectionUtilityController,
  deleteCollectionController,
  getCollectionBySlugController,
  getCollectionCategoriesController,
  getCollectionUtilitiesController,
  updateCollectionCategoryController,
  updateCollectionController,
} from '../../../../services/wiki/collection';

const clRouter = express.Router();

clRouter
  .route('/s/:slug')
  .get(
    passportJwtAuthOptional,
    validateGetCollectionBySlug,
    handleBadRequest,
    getCollectionBySlugController
  )
  .patch(
    passportJwtAuth,
    validateUpdateCollection,
    handleBadRequest,
    updateCollectionController
  )
  .delete(
    passportJwtAuth,
    validateDeleteCollection,
    handleBadRequest,
    deleteCollectionController
  );

clRouter.post(
  '/',
  passportJwtAuth,
  validateCreateCollection,
  handleBadRequest,
  createCollectionController
);

clRouter
  .route('/category')
  .get(
    validateGetCollectionCategories,
    handleBadRequest,
    getCollectionCategoriesController
  )
  .post(
    passportJwtAuth,
    validateCreateCollectionCategory,
    handleBadRequest,
    createCollectionCategoryController
  );
clRouter
  .route('/category/:cid')
  .patch(
    passportJwtAuth,
    validateUpdateCollectionCategory,
    handleBadRequest,
    updateCollectionCategoryController
  );

clRouter
  .route('/category/:cid/utility')
  .get(
    validateGetCollectionUtilities,
    handleBadRequest,
    getCollectionUtilitiesController
  )
  .post(
    passportJwtAuth,
    validateCreateCollectionUtility,
    handleBadRequest,
    createCollectionUtilityController
  );
export default clRouter;
