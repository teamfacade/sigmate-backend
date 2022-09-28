import express from 'express';
import { passportJwtAuth } from '../../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import { validateCreateWikiDocument } from '../../../../middlewares/validators/wiki/document';
import {
  createWikiDocumentController,
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
  )
  .patch(passportJwtAuth, updateWikiDocumentController);

export default docRouter;
