import express from 'express';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import { validateAddEmailToWaitingList } from '../../../middlewares/validators/waiting';
import {
  addEmailToWaitingListController,
  getWaitingListCountController,
} from '../../../services/waiting';

const waitingRouter = express.Router();

waitingRouter
  .route('/email')
  .get(getWaitingListCountController)
  .post(
    validateAddEmailToWaitingList,
    handleBadRequest,
    addEmailToWaitingListController
  );

export default waitingRouter;
