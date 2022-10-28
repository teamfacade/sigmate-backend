import express from 'express';
import { passportJwtAuth } from '../../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import handlePagination from '../../../../middlewares/handlePagination';
import {
  validateGetMyMintingSchedules,
  validateSaveMintingSchedule,
  validateUnsaveMintingSchedule,
} from '../../../../middlewares/validators/calendar';
import {
  getMyMintingSchedulesController,
  saveMintingScheduleController,
  unsaveMintingScheduleController,
} from '../../../../services/calendar/my';

const myRouter = express.Router();

// All endpoints below require authentication
myRouter.use(passportJwtAuth);

myRouter
  .route('/minting')
  .get(
    handlePagination,
    validateGetMyMintingSchedules,
    handleBadRequest,
    getMyMintingSchedulesController
  )
  .post(
    validateSaveMintingSchedule,
    handleBadRequest,
    saveMintingScheduleController
  )
  .delete();
myRouter
  .route('/minting/:id')
  .delete(
    validateUnsaveMintingSchedule,
    handleBadRequest,
    unsaveMintingScheduleController
  );

export default myRouter;
