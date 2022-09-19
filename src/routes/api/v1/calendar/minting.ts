import express from 'express';
import {
  passportJwtAuth,
  passportJwtAuthOptional,
} from '../../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import handlePagination from '../../../../middlewares/handlePagination';
import {
  validateCreateMintingSchedule,
  validateGetMintingSchedules,
} from '../../../../middlewares/validators/calendar';
import {
  createMintingScheduleController,
  getMintingSchedulesController,
} from '../../../../services/calendar';

const mintingRouter = express.Router();

mintingRouter
  .route('/')
  .get(
    passportJwtAuthOptional,
    handlePagination,
    validateGetMintingSchedules,
    handleBadRequest,
    getMintingSchedulesController
  )
  .post(
    passportJwtAuth,
    validateCreateMintingSchedule,
    handleBadRequest,
    createMintingScheduleController
  );

export default mintingRouter;
