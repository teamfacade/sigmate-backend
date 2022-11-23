import express from 'express';
import {
  passportJwtAuth,
  passportJwtAuthOptional,
} from '../../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import handlePagination from '../../../../middlewares/handlePagination';
import {
  validateCreateWikiDocument,
  validateGetWikiDocumentById,
  validateUpdateWikiDocument,
} from '../../../../middlewares/validators/wiki/document';
import { validateSearchWikiDocument } from '../../../../middlewares/validators/wiki/search';
import {
  createWikiDocumentController,
  getWikiDocumentByIdController,
  updateWikiDocumentController,
} from '../../../../services/wiki/document';
import { searchWikiDocumentController } from '../../../../services/wiki/search';

const docRouter = express.Router();

docRouter
  .route('/')
  .get(
    handlePagination,
    validateSearchWikiDocument,
    handleBadRequest,
    searchWikiDocumentController
  )
  .post(
    passportJwtAuth,
    validateCreateWikiDocument,
    handleBadRequest,
    createWikiDocumentController
  );
docRouter
  .route('/:id')
  .get(
    passportJwtAuthOptional,
    validateGetWikiDocumentById,
    handleBadRequest,
    getWikiDocumentByIdController
  )
  .patch(
    passportJwtAuth,
    validateUpdateWikiDocument,
    handleBadRequest,
    updateWikiDocumentController
  );

export default docRouter;
