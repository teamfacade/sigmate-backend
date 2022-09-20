import express from 'express';
import { passportJwtAuth } from '../../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import handlePagination from '../../../../middlewares/handlePagination';
import {
  validateGetMyMintingSchedules,
  validateSaveMintingSchedule,
} from '../../../../middlewares/validators/calendar';
import {
  getMyMintingSchedulesController,
  saveMintingScheduleController,
} from '../../../../services/calendar/my';

const myRouter = express.Router();

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
  );

export default myRouter;
