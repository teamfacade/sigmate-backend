import express from 'express';
import {
  passportJwtAuth,
  passportJwtAuthOptional,
} from '../../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import {
  validateCreateWikiDocument,
  validateGetWikiDocumentById,
  validateUpdateWikiDocument,
} from '../../../../middlewares/validators/wiki/document';
import {
  createWikiDocumentController,
  getWikiDocumentByIdController,
  updateWikiDocumentController,
} from '../../../../services/wiki/document';

const docRouter = express.Router();

docRouter
  .route('/')
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
