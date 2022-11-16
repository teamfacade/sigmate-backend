import express from 'express';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import handlePagination from '../../../../middlewares/handlePagination';
import { validateGetRecentEdits } from '../../../../middlewares/validators/wiki/activity';
import { getRecentEditsController } from '../../../../services/wiki/activity';

const activityRouter = express.Router();

activityRouter.get(
  '/edits',
  handlePagination,
  validateGetRecentEdits,
  handleBadRequest,
  getRecentEditsController
);

export default activityRouter;
