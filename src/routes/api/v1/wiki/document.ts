import express from 'express';
import { passportJwtAuth } from '../../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import { validateCreateWikiDocument } from '../../../../middlewares/validators/wiki/document';
import { createWikiDocumentController } from '../../../../services/wiki/document';

const docRouter = express.Router();

docRouter
  .route('/')
  .post(
    passportJwtAuth,
    validateCreateWikiDocument,
    handleBadRequest,
    createWikiDocumentController
  );

export default docRouter;
