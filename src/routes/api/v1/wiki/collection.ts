import express from 'express';
import {
  passportJwtAuth,
  passportJwtAuthOptional,
} from '../../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import {
  validateCreateCollection,
  validateDeleteCollection,
  validateGetCollectionBySlug,
  validateUpdateCollection,
} from '../../../../middlewares/validators/wiki/collection';
import {
  createCollectionController,
  getCollectionBySlugController,
  updateCollectionController,
} from '../../../../services/wiki/collection';

const clRouter = express.Router();

clRouter
  .route('/:slug')
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
  .delete(passportJwtAuth, validateDeleteCollection, handleBadRequest);

clRouter.post(
  '/',
  passportJwtAuth,
  validateCreateCollection,
  handleBadRequest,
  createCollectionController
);

export default clRouter;
